
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShoppingBag, Star, Undo2, Edit, Ticket } from "lucide-react";
import type { Order } from '@/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const db = getFirestore(app);

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    : status === 'return-requested'
    ? orders.filter(order => order.status === 'return-requested' || order.status === 'returned')
    : status === 'delivered'
    ? orders.filter(order => order.status === 'delivered' || order.status === 'return-rejected')
    : orders.filter(order => order.status === status);
    
  const pageTitle = status === 'all' ? 'My Orders' : `My ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} Orders`;
    
  if (loading) {
      return <LoadingSpinner />;
  }
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, orderId: string) => {
    // Check if the click target is a button or inside a button
    if (e.target instanceof HTMLElement && e.target.closest('button, a')) {
        return;
    }
    router.push(`/account/orders/${orderId}`);
  };

  const getStatusBadge = (orderStatus: Order['status']) => {
      switch(orderStatus) {
          case 'return-rejected':
              return <Badge variant="destructive">Return Rejected</Badge>;
          case 'returned':
              return <Badge className="bg-blue-100 text-blue-800 capitalize">Returned</Badge>;
          default:
              return <Badge className="capitalize bg-primary hover:bg-primary text-primary-foreground">{orderStatus.replace('-', ' ')}</Badge>
      }
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
                        <Card key={order.id} className="shadow-sm transition-shadow hover:shadow-md">
                            <div 
                              className="cursor-pointer"
                              onClick={(e) => handleCardClick(e, order.id)}
                            >
                              <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h2 className="text-lg font-bold">Order ID: #{order.orderNumber}</h2>
                                          <p className="text-sm text-muted-foreground">Placed on: {new Date(order.date).toLocaleDateString()}</p>
                                      </div>
                                      {getStatusBadge(order.status)}
                                  </div>
                                  <div className="mt-4">
                                      <p className="font-bold text-lg">Total Amount: ৳{order.total.toFixed(2)}</p>
                                  </div>
                              </CardContent>
                            </div>
                            
                            <CardFooter className="bg-muted/30 p-4">
                                {(order.status === 'delivered' || order.status === 'return-rejected' || order.status === 'returned') && (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        {order.status === 'return-rejected' ? (
                                            <Button variant="outline" size="sm" disabled className="w-full bg-red-100 text-red-800 border-red-200">
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Return Rejected
                                            </Button>
                                        ) : order.status === 'returned' ? (
                                            <Button variant="outline" size="sm" asChild className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 border-blue-200">
                                                <Link href="/vouchers">
                                                    <Ticket className="mr-2 h-4 w-4" />
                                                    View Voucher
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" asChild className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 border-red-200">
                                                <Link href={`/account/returns/${order.id}`}>
                                                    <Undo2 className="mr-2 h-4 w-4" />
                                                    Return
                                                </Link>
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" asChild className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 border-green-200">
                                            <Link href="/account/reviews">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Write a Review
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardFooter>
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
