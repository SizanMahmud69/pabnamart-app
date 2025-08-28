
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Star, Undo2 } from "lucide-react";
import type { Order } from '@/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'all';
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = status === 'all' 
    ? orders 
    : orders.filter(order => order.status === status);
    
  const pageTitle = status === 'all' ? 'My Orders' : `My ${status.charAt(0).toUpperCase() + status.slice(1)} Orders`;
    
  if (loading) {
      return <LoadingSpinner />;
  }

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Button asChild variant="ghost" size="icon" className="mr-2">
                    <Link href="/account">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
            </div>
            
            <div>
                {filteredOrders.length > 0 ? (
                    <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <Card key={order.id} className="shadow-sm">
                            <Link href={`/account/orders/${order.id}`} className="block hover:bg-muted/50 transition-colors rounded-t-lg">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Order #{order.orderNumber}</CardTitle>
                                            <CardDescription>Date: {new Date(order.date).toLocaleDateString()}</CardDescription>
                                        </div>
                                         <p className="font-semibold capitalize px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">{order.status.replace('-', ' ')}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Items: {order.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
                                            <p className="font-bold text-lg">Total: ৳{order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                             {order.status === 'delivered' && (
                                <>
                                <Separator />
                                <div className="p-4 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/account/reviews">
                                            <Star className="mr-2 h-4 w-4" />
                                            Write a Review
                                        </Link>
                                    </Button>
                                    <Button variant="secondary" size="sm" asChild>
                                        <Link href="#">
                                            <Undo2 className="mr-2 h-4 w-4" />
                                            Return
                                        </Link>
                                    </Button>
                                </div>
                                </>
                            )}
                        </Card>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h2 className="mt-4 text-xl font-semibold">No Orders Found</h2>
                        <p className="text-muted-foreground">You have no orders with this status.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
