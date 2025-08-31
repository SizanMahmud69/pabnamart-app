
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, PackageSearch, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Order, OrderStatus } from '@/types';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDeliveryCharge } from '@/hooks/useDeliveryCharge';

const db = getFirestore(app);

const statusSteps: OrderStatus[] = ['processing', 'shipped', 'in-transit', 'delivered'];

const TrackingStep = ({ step, label, isCompleted, isCurrent, date }: { step: number, label: string, isCompleted: boolean, isCurrent: boolean, date?: string }) => (
    <div className="flex flex-col items-center text-center">
        <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isCompleted ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30",
            isCurrent && "ring-4 ring-primary/30"
        )}>
            {isCompleted && <div className="w-3 h-3 bg-primary-foreground rounded-full" />}
        </div>
        <p className={cn(
            "text-xs mt-1 w-20",
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

    const getEstimatedDeliveryDate = () => {
        if (!order || !isClient) return null;
        
        const isInsidePabna = order.shippingAddress.city.toLowerCase().trim() === 'pabna';
        const deliveryTime = isInsidePabna ? deliveryTimeInside : deliveryTimeOutside;

        if (deliveryTime === 0) return null; 

        const orderDate = new Date(order.date);
        return addDays(orderDate, deliveryTime);
    };

    const estimatedDate = getEstimatedDeliveryDate();
    const currentStatusIndex = order ? statusSteps.indexOf(order.status) : -1;

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
                            {estimatedDate && (
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

                                    <div className="mt-8 relative flex justify-between items-start">
                                        <div className="absolute top-3 left-0 w-full h-0.5 bg-muted-foreground/30" />
                                        <div 
                                            className="absolute top-3 left-0 h-0.5 bg-primary transition-all duration-500"
                                            style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                        />
                                        {statusSteps.map((status, index) => (
                                            <TrackingStep 
                                                key={status}
                                                step={index + 1} 
                                                label={status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                                                isCompleted={currentStatusIndex >= index}
                                                isCurrent={currentStatusIndex === index}
                                                date={statusDates[status]}
                                            />
                                        ))}
                                    </div>
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
