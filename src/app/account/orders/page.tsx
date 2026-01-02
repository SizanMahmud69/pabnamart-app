
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Star, ChevronRight, Eye, Undo2 } from 'lucide-react';
import { withAuth, useAuth } from '@/hooks/useAuth';
import type { Order } from '@/types';
import { getFirestore, collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';


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
    const statusQuery = searchParams.get('status');
    const { toast } = useToast();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const db = getFirestore(app);
        const ordersRef = collection(db, 'orders');
        let q;
        if (statusQuery && statusTabs.includes(statusQuery as Order['status'])) {
            q = query(ordersRef, where('userId', '==', user.uid), where('status', '==', statusQuery), orderBy('date', 'desc'));
        } else {
            q = query(ordersRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
        }


        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
            setOrders(userOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, statusQuery]);

    const handleReturnOrder = async (orderId: string) => {
        const db = getFirestore(app);
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status: 'returned' });
            toast({
                title: "Order Return Requested",
                description: "Your return request has been submitted.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to request return.",
                variant: "destructive",
            });
        }
    }
    
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
                        <CardDescription>
                            {statusQuery ? `Showing your ${statusQuery} orders.` : 'View all your order history and status.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <Card key={order.id} className="overflow-hidden shadow-md transition-shadow hover:shadow-lg">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start text-sm text-muted-foreground">
                                                <div>
                                                    <p>Order #{order.orderNumber}</p>
                                                    <p>{new Date(order.date).toLocaleDateString()}</p>
                                                </div>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                            </div>
                                            <Separator />
                                            <div className="space-y-4">
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
                                            </div>
                                            <Separator />
                                            <div className="flex justify-end font-bold text-lg">
                                                Total: ৳{order.total}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/50 p-3 flex justify-between items-center">
                                            <div className="flex gap-2">
                                                {order.status === 'delivered' && (
                                                    <Button variant="outline" size="sm" onClick={() => handleReturnOrder(order.id)}>
                                                        <Undo2 className="mr-2 h-4 w-4" />
                                                        Return
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status === 'delivered' && (
                                                    <Button variant="outline" size="sm">
                                                        <Star className="mr-2 h-4 w-4" />
                                                        Review
                                                    </Button>
                                                )}
                                                <Button asChild variant="ghost" size="icon">
                                                    <Link href={`/account/orders/${order.id}`}>
                                                        <Eye className="h-5 w-5" />
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
