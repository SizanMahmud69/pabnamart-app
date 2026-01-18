"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Star, ChevronRight, Eye, Undo2, CheckCircle, XCircle } from 'lucide-react';
import { withAuth, useAuth } from '@/hooks/useAuth';
import type { Order, Review } from '@/types';
import { getFirestore, collection, query, where, onSnapshot, orderBy, updateDoc, doc, collectionGroup } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createAndSendNotification } from '@/app/actions';


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

const statusTabs: (Order['status'] | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

function MyOrdersPageContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const statusQuery = searchParams.get('status');
    const { toast } = useToast();

    const [orders, setOrders] = useState<Order[]>([]);
    const [userReviews, setUserReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const ordersRef = collection(db, 'orders');
        let q;
        if (statusQuery && (statusTabs.includes(statusQuery as Order['status']) || statusQuery === 'return-requested' || statusQuery === 'return-approved')) {
            q = query(ordersRef, where('userId', '==', user.uid), where('status', '==', statusQuery), orderBy('date', 'desc'));
        } else {
            q = query(ordersRef, where('userId', '==', user.uid), orderBy('date', 'desc'));
        }


        const unsubscribeOrders = onSnapshot(q, (snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
            setOrders(userOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        const reviewsRef = collectionGroup(db, 'reviews');
        const reviewsQuery = query(reviewsRef, where('user.uid', '==', user.uid));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviews = snapshot.docs.map(doc => doc.data() as Review);
            setUserReviews(reviews);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeReviews();
        };
    }, [user, statusQuery]);

    const handleCancelOrder = async (orderId: string) => {
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status: 'cancelled' });
            
            const order = orders.find(o => o.id === orderId);
            if (order) {
                 await createAndSendNotification(order.userId, {
                    icon: 'XCircle',
                    title: 'Order Cancelled by You',
                    description: `Your order #${order.orderNumber} has been successfully cancelled.`,
                    href: `/account/orders/${order.id}`
                });
            }

            toast({
                title: "Order Cancelled",
                description: "Your order has been successfully cancelled.",
            });
        } catch (error) {
            console.error("Error cancelling order: ", error);
            toast({
                title: "Error",
                description: "Failed to cancel the order.",
                variant: "destructive"
            });
        }
    };

    const hasReviewed = (productId: number) => {
        return userReviews.some(review => review.productId === productId);
    };

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
                            {statusQuery ? `Showing your ${statusQuery.replace('-', ' ')} orders.` : 'View all your order history and status.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <Card key={order.id} className="overflow-hidden shadow-md transition-shadow hover:shadow-lg">
                                        <CardHeader className="p-4 flex flex-row justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                                <CardDescription>{new Date(order.date).toLocaleDateString()}</CardDescription>
                                            </div>
                                            <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace('-', ' ')}</Badge>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            
                                            <div className="space-y-4">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex items-center gap-4">
                                                        <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                                        <div className="flex-grow">
                                                            <p className="font-semibold">{item.name}</p>
                                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                        </div>
                                                         <div className="text-right">
                                                            <p className="font-semibold">৳{item.price * item.quantity}</p>
                                                        </div>
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
                                                 {(() => {
                                                    if (order.status !== 'delivered') return null;

                                                    const firstUnreviewedItem = order.items.find(item => !hasReviewed(item.id));
                                                    
                                                    if (firstUnreviewedItem) {
                                                        return (
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={`/account/reviews/new?productId=${firstUnreviewedItem.id}&productName=${encodeURIComponent(firstUnreviewedItem.name)}&orderId=${order.id}`}>
                                                                    <Star className="mr-2 h-4 w-4" />
                                                                    Review
                                                                </Link>
                                                            </Button>
                                                        );
                                                    }
                                                    
                                                    if (order.items.length > 0) {
                                                        return (
                                                            <Button variant="outline" size="sm" disabled>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                Reviewed
                                                            </Button>
                                                        );
                                                    }

                                                    return null;
                                                })()}
                                                {order.status === 'delivered' && (
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/account/returns?orderId=${order.id}`}>
                                                            <Undo2 className="mr-2 h-4 w-4" />
                                                            Return
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                {order.paymentMethod === 'cash-on-delivery' && order.status === 'processing' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Cancel
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This action will cancel your order. This cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleCancelOrder(order.id)}>Cancel Order</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
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

function MyOrdersPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <MyOrdersPageContent />
        </Suspense>
    )
}

export default withAuth(MyOrdersPage);
