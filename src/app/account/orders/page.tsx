
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react';
import { withAuth, useAuth } from '@/hooks/useAuth';
import type { Order } from '@/types';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';


const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'processing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': return 'default';
        case 'cancelled': return 'destructive';
        case 'returned': return 'destructive';
        default: return 'outline';
    }
};

const statusTabs: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

function MyOrdersPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const statusQuery = searchParams.get('status') || 'all';

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(statusQuery);

    useEffect(() => {
        if (!user) return;
        
        const ordersRef = collection(getFirestore(app), 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
            setOrders(userOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') return orders;
        return orders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-3xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
                
                <Card>
                    <CardHeader>
                        <CardTitle>My Orders</CardTitle>
                        <CardDescription>View your order history and status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                {statusTabs.map(status => (
                                    <TabsTrigger key={status} value={status} className="capitalize">{status}</TabsTrigger>
                                ))}
                            </TabsList>
                            
                             <div className="mt-6 space-y-4">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map(order => (
                                        <Card key={order.id} className="overflow-hidden">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Order #{order.orderNumber}</span>
                                                    <span>{new Date(order.date).toLocaleDateString()}</span>
                                                </div>
                                                <Separator />
                                                {order.items.map(item => (
                                                     <div key={item.id} className="flex items-center gap-4">
                                                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                                        <div className="flex-grow">
                                                            <p className="font-semibold">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                        </div>
                                                        <p className="font-semibold">৳{item.price * item.quantity}</p>
                                                    </div>
                                                ))}
                                                <Separator />
                                                <div className="flex justify-end font-bold text-lg">
                                                    Total: ৳{order.total}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-muted/50 p-3 flex justify-between items-center">
                                                 <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                                <div className="flex gap-2">
                                                    {order.status === 'delivered' && (
                                                        <Button variant="outline" size="sm">
                                                            <Star className="mr-2 h-4 w-4" />
                                                            Review
                                                        </Button>
                                                    )}
                                                    <Button asChild variant="default" size="sm">
                                                        <Link href={`/account/orders/${order.id}`}>
                                                            View Details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))
                                ) : (
                                     <div className="text-center py-16">
                                        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                                        <h2 className="mt-4 text-xl font-semibold">No Orders in this Category</h2>
                                        <p className="text-muted-foreground">You don't have any orders with this status yet.</p>
                                    </div>
                                )}
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function MyOrdersPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <MyOrdersPageContent />
        </Suspense>
    )
}
