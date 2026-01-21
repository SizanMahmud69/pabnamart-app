
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search, Package, ShoppingBag, Truck, CheckCircle, XCircle, Undo2, PackageCheck, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order } from '@/types';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const db = getFirestore(app);

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'processing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': return 'default';
        case 'cancelled': return 'destructive';
        case 'returned': return 'destructive';
        case 'return-requested': return 'secondary';
        case 'return-approved': return 'default';
        case 'return-shipped': return 'default';
        case 'return-denied': return 'destructive';
        default: return 'outline';
    }
};

interface TimelineEvent {
    status: string;
    title: string;
    description: string;
    icon: LucideIcon;
    isCurrent: boolean;
    isCompleted: boolean;
}

const generateTimeline = (order: Order): TimelineEvent[] => {
    const standardSteps: { status: Order['status']; title: string; icon: LucideIcon }[] = [
        { status: 'pending', title: 'Order Placed', icon: ShoppingBag },
        { status: 'processing', title: 'Processing', icon: Package },
        { status: 'shipped', title: 'Shipped', icon: Truck },
        { status: 'delivered', title: 'Delivered', icon: CheckCircle },
    ];
    
    const returnSteps: { status: Order['status']; title: string; icon: LucideIcon }[] = [
        { status: 'return-requested', title: 'Return Requested', icon: Undo2 },
        { status: 'return-approved', title: 'Return Approved', icon: CheckCircle },
        { status: 'return-shipped', title: 'Item Shipped Back', icon: Truck },
        { status: 'returned', title: 'Return Finalized', icon: PackageCheck },
    ];

    if (order.status === 'cancelled') {
        return [{
            status: 'cancelled', title: 'Order Cancelled',
            description: `This order was cancelled.`,
            icon: XCircle, isCurrent: true, isCompleted: true
        }];
    }
    
    if (order.status === 'return-denied') {
        return [{
            status: 'return-denied', title: 'Return Denied',
            description: `This return request was denied.`,
            icon: XCircle, isCurrent: true, isCompleted: true
        }];
    }

    const isReturnFlow = returnSteps.some(s => s.status === order.status) || order.status === 'returned';
    const activeSteps = isReturnFlow ? returnSteps : standardSteps;
    const currentStatusIndex = activeSteps.findIndex(s => s.status === order.status);

    return activeSteps.map((step, index) => {
        let description = `Your order is ${step.title.toLowerCase()}.`;
        if (step.status === 'pending') {
            description = `Placed on ${new Date(order.date).toLocaleString()}`;
        }
        if (step.status === 'delivered' && order.deliveredAt) {
            description = `Delivered on ${new Date(order.deliveredAt).toLocaleString()}`;
        }

        return {
            ...step,
            description,
            isCurrent: index === currentStatusIndex,
            isCompleted: index < currentStatusIndex || order.status === 'delivered' || order.status === 'returned',
        }
    });
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setOrder(null);
        setError(null);
        setSearched(true);

        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderNumber', '==', orderId.trim()), limit(1));

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setError("No order found with this ID. Please check the ID and try again.");
            } else {
                const doc = querySnapshot.docs[0];
                setOrder({ id: doc.id, ...doc.data() } as Order);
            }
        } catch (err) {
            setError("An error occurred while searching for the order.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const timelineEvents = order ? generateTimeline(order) : [];

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-8">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Track Your Order</CardTitle>
                        <CardDescription>Enter your order ID to see its current status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <Input
                                id="order-id"
                                placeholder="Enter Order ID (e.g., 24012112345)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Track</span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {loading && (
                     <div className="mt-6 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {searched && !loading && (
                    <div className="mt-6">
                        {order ? (
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>Order #{order.orderNumber}</CardTitle>
                                            <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                                        </div>
                                        <Badge variant={getStatusVariant(order.status)} className="capitalize text-lg">{order.status.replace('-', ' ')}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <OrderStatusStepper currentStatus={order.status} />
                                     <Separator />
                                     <div>
                                        <h3 className="text-lg font-semibold mb-4">Order History</h3>
                                        <div className="relative pl-4 space-y-8">
                                            {timelineEvents.map((event, index) => (
                                                <div key={index} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "flex h-10 w-10 items-center justify-center rounded-full border-2",
                                                            event.isCompleted || event.isCurrent ? "border-primary" : "border-muted-foreground/30",
                                                            event.isCompleted ? "bg-primary text-primary-foreground" : "bg-muted"
                                                        )}>
                                                            <event.icon className={cn("h-5 w-5", !event.isCompleted && "text-muted-foreground")} />
                                                        </div>
                                                        {index < timelineEvents.length - 1 && (
                                                            <div className={cn(
                                                                "w-0.5 flex-1 mt-2",
                                                                event.isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                                                            )} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{event.title}</p>
                                                        <p className="text-sm text-muted-foreground">{event.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                </CardContent>
                                <CardFooter>
                                     <div className="flex justify-between font-bold text-xl w-full">
                                        <span>Total</span>
                                        <span>৳{order.total}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">Order Not Found</h3>
                                    <p className="text-muted-foreground text-sm">{error || "Please check the order ID and try again."}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}
