
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, PackageSearch, Loader2, CheckCircle, Package, Undo2, Truck, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import type { Order, OrderStatus } from '@/types';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDeliveryCharge } from '@/hooks/useDeliveryCharge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const db = getFirestore(app);

const baseStatusSteps: OrderStatus[] = ['processing', 'shipped', 'in-transit', 'delivered'];
const returnStatusSteps: OrderStatus[] = ['return-requested', 'return-processing', 'returned'];
const returnRejectedStatusSteps: OrderStatus[] = ['return-requested', 'return-rejected'];


const TrackingStep = ({ icon: Icon, label, isCompleted, isCurrent, date }: { icon: any, label: string, isCompleted: boolean, isCurrent: boolean, date?: string }) => (
    <div className="flex flex-col items-center text-center px-4">
        <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-muted-foreground/30",
            isCurrent && "ring-4 ring-primary/30"
        )}>
           <Icon className="h-4 w-4" />
        </div>
        <p className={cn(
            "text-xs mt-1 w-20 whitespace-normal",
            isCompleted || isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
        )}>{label}</p>
        {date && isCompleted && (
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(date), 'PP')}</p>
        )}
    </div>
);


export default function OrderTrackingPage() {
    const [orderNumber, setOrderNumber] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { toast } = useToast();
    const { deliveryTimeInside, deliveryTimeOutside } = useDeliveryCharge();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!orderNumber.trim()) {
            toast({ title: "Error", description: "Please enter an order number.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setSearched(true);
        setOrder(null);
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('orderNumber', '==', orderNumber.trim()), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setOrder(null);
            } else {
                setOrder({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Order);
            }
        } catch (error) {
            console.error("Error searching order: ", error);
            toast({ title: "Error", description: "Failed to track order.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const { statusSteps, currentStatusIndex, statusIcons, statusLabels } = useMemo(() => {
        const icons: { [key in OrderStatus]?: any } = {
            'processing': Package,
            'shipped': Truck,
            'in-transit': Truck,
            'delivered': CheckCircle,
            'return-requested': Undo2,
            'return-processing': RefreshCw,
            'returned': Package,
            'return-rejected': XCircle
        };
        const labels: { [key in OrderStatus]?: string } = {
            'processing': 'Processing',
            'shipped': 'Shipped',
            'in-transit': 'In-Transit',
            'delivered': 'Delivered',
            'return-requested': 'Return Request',
            'return-processing': 'Return Processing',
            'returned': 'Returned',
            'return-rejected': 'Return Rejected'
        };

        if (!order) {
            return { statusSteps: baseStatusSteps, currentStatusIndex: -1, statusIcons: icons, statusLabels: labels };
        }

        if (['return-requested', 'return-processing', 'returned'].includes(order.status)) {
             const allSteps = [...baseStatusSteps, ...returnStatusSteps];
             const currentIndex = allSteps.indexOf(order.status);
             return { statusSteps: allSteps, currentStatusIndex: currentIndex, statusIcons: icons, statusLabels: labels };
        }

        if (order.status === 'return-rejected') {
            const allSteps = [...baseStatusSteps, ...returnRejectedStatusSteps];
            const currentIndex = allSteps.indexOf(order.status);
            return { statusSteps: allSteps, currentStatusIndex: currentIndex, statusIcons: icons, statusLabels: labels };
        }
        
        const currentIndex = baseStatusSteps.indexOf(order.status);
        return { statusSteps: baseStatusSteps, currentStatusIndex: currentIndex, statusIcons: icons, statusLabels: labels };
    }, [order]);


    const getEstimatedDeliveryDate = () => {
        if (!order || !isClient) return null;
        
        const isInsidePabna = order.shippingAddress.city.toLowerCase().trim() === 'pabna';
        const deliveryTime = isInsidePabna ? deliveryTimeInside : deliveryTimeOutside;

        if (deliveryTime === 0) return null; 

        const orderDate = new Date(order.date);
        return addDays(orderDate, deliveryTime);
    };

    const estimatedDate = getEstimatedDeliveryDate();

    const statusDates = useMemo(() => {
        if (!order?.statusHistory) return {};
        return order.statusHistory.reduce((acc, history) => {
            acc[history.status] = history.date;
            return acc;
        }, {} as Record<OrderStatus, string>);
    }, [order]);


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
                        <CardDescription>Enter your order number to see its status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Enter Your Order (without #)"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2 hidden sm:inline">Track</span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">Searching for your order...</p>
                        </div>
                    ) : order ? (
                        <div className="space-y-6">
                             {order.status === 'delivered' || ['return-requested', 'return-processing', 'returned', 'return-rejected'].includes(order.status) ? (
                                order.deliveryDate ? (
                                    <div className="bg-green-100/60 rounded-lg p-6 text-center">
                                        <p className="text-sm text-green-700">Delivered On</p>
                                        <p className="text-3xl font-bold text-green-800">{format(new Date(order.deliveryDate), 'eeee')}</p>
                                        <p className="text-5xl font-bold text-green-600">{format(new Date(order.deliveryDate), 'd')}</p>
                                        <p className="text-xl text-green-700">{format(new Date(order.deliveryDate), 'MMMM yyyy')}</p>
                                    </div>
                                ) : null
                            ) : estimatedDate && (
                                <div className="bg-muted/50 rounded-lg p-6 text-center">
                                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                                    <p className="text-3xl font-bold">{format(estimatedDate, 'eeee')}</p>
                                    <p className="text-5xl font-bold text-primary">{format(estimatedDate, 'd')}</p>
                                    <p className="text-xl text-muted-foreground">{format(estimatedDate, 'MMMM yyyy')}</p>
                                </div>
                            )}

                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold text-center capitalize">{order.status.replace('-', ' ')}</h3>
                                    <p className="text-center text-muted-foreground text-sm">
                                        Last updated: {format(new Date(order.statusHistory?.slice(-1)[0].date || order.date), "PPP p")}
                                    </p>

                                    <ScrollArea className="w-full whitespace-nowrap pt-8">
                                        <div className="relative flex items-start pb-4">
                                            <div className="absolute top-4 left-0 w-full h-0.5 bg-muted-foreground/30" />
                                            <div 
                                                className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
                                                style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                            />
                                            <div className="flex justify-between w-full">
                                            {statusSteps.map((status, index) => {
                                                const Icon = statusIcons[status] || Package;
                                                const label = statusLabels[status] || status;
                                                
                                                let isCompleted = currentStatusIndex >= index;
                                                if (order.status === 'returned' && ['return-requested', 'return-processing'].includes(status)) {
                                                    isCompleted = true;
                                                } else if (order.status === 'return-processing' && status === 'return-requested') {
                                                    isCompleted = true;
                                                } else if (order.status === 'return-rejected' && status === 'return-requested') {
                                                    isCompleted = true;
                                                }

                                                return (
                                                    <TrackingStep 
                                                        key={status}
                                                        icon={Icon}
                                                        label={label}
                                                        isCompleted={isCompleted}
                                                        isCurrent={currentStatusIndex === index}
                                                        date={statusDates[status]}
                                                    />
                                                )
                                            })}
                                            </div>
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                    
                                    <div className="mt-4 text-center">
                                        <Button asChild variant="link">
                                            <Link href={`/account/orders/${order.id}`}>See Full Shipping Details</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : searched && (
                        <div className="text-center py-16">
                            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-xl font-semibold">Order Not Found</h2>
                            <p className="text-muted-foreground">We couldn't find an order with that number. Please check and try again.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

    