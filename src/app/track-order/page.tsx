
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Search, Package } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order } from '@/types';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
                                        <h3 className="text-lg font-semibold mb-2">Items</h3>
                                        {order.items.map((item, index) => (
                                            <div key={`${item.id}-${index}`} className="flex items-center gap-4 py-2">
                                                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover border" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold text-sm">৳{item.price * item.quantity}</p>
                                            </div>
                                        ))}
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
