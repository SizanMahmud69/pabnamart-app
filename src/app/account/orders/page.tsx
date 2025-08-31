
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ShoppingBag, Star, Undo2, Edit, Ticket, Info } from "lucide-react";
import type { Order, OrderItem } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useDeliveryCharge } from '@/hooks/useDeliveryCharge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

const db = getFirestore(app);

const ReturnInstructions = () => {
    const { returnAddress } = useDeliveryCharge();
    const [isOpen, setIsOpen] = useState(false);

    if (!returnAddress) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Info className="mr-2 h-4 w-4" />
                    Return Instructions
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                 <Alert className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                        <p>Please send the product(s) to the following address. Once we receive and verify the items, we will issue a voucher for the item's subtotal amount.</p>
                        <address className="not-italic p-2 bg-muted rounded-md text-foreground font-semibold">
                            {returnAddress}
                        </address>
                    </AlertDescription>
                </Alert>
            </CollapsibleContent>
        </Collapsible>
    )
}

const OrderReturnButton = ({ order }: { order: Order }) => {
    const isReturnable = useMemo(() => {
        if (order.status !== 'delivered' || !order.deliveryDate) {
            return { canReturn: false, reason: "Order not delivered yet." };
        }
    
        const hasReturnableItem = order.items.some(item => typeof item.returnPolicy === 'number');
        if (!hasReturnableItem) {
            return { canReturn: false, reason: "No items in this order are returnable." };
        }
    
        const maxReturnDays = Math.max(...order.items.map(item => item.returnPolicy || 0));
        
        if (maxReturnDays === 0) {
            return { canReturn: false, reason: "Items in this order are not returnable." };
        }

        const deliveryDate = new Date(order.deliveryDate);
        const returnDeadline = new Date(deliveryDate);
        returnDeadline.setDate(deliveryDate.getDate() + maxReturnDays);
    
        const now = new Date();
    
        if (now > returnDeadline) {
            return { canReturn: false, reason: `Return period of ${maxReturnDays} days has expired.` };
        }
    
        return { canReturn: true, reason: "" };

    }, [order]);


    if (order.status === 'return-rejected') {
        return (
            <Button variant="outline" size="sm" disabled className="w-full bg-red-100 text-red-800 border-red-200">
                <Undo2 className="mr-2 h-4 w-4" />
                Return Rejected
            </Button>
        );
    }
    
    if (order.status === 'returned') {
        return (
            <Button variant="outline" size="sm" asChild className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 border-blue-200">
                <Link href="/account/vouchers">
                    <Ticket className="mr-2 h-4 w-4" />
                    View Voucher
                </Link>
            </Button>
        );
    }
    
    if (!isReturnable.canReturn) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="w-full">
                            <Button variant="outline" size="sm" disabled className="w-full">
                                <Undo2 className="mr-2 h-4 w-4" />
                                Return
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isReturnable.reason}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Button variant="outline" size="sm" asChild className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 border-red-200">
            <Link href={`/account/returns/${order.id}`}>
                <Undo2 className="mr-2 h-4 w-4" />
                Return
            </Link>
        </Button>
    )
}

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

  const filteredOrders = useMemo(() => {
    if (status === 'all') return orders;
    if (status === 'return-requested') {
      return orders.filter(order => ['return-requested', 'return-processing', 'returned', 'return-rejected'].includes(order.status));
    }
    if (status === 'delivered') {
      return orders.filter(order => order.status === 'delivered');
    }
    return orders.filter(order => order.status === status);
  }, [orders, status]);
    
  useEffect(() => {
    if (status === 'delivered') {
      const deliveredOrderIds = filteredOrders
        .filter(order => order.status === 'delivered')
        .map(order => order.id);
        
      if (deliveredOrderIds.length > 0) {
        const viewedOrders = JSON.parse(localStorage.getItem('viewedDeliveredOrders') || '[]');
        const newViewedOrders = Array.from(new Set([...viewedOrders, ...deliveredOrderIds]));
        localStorage.setItem('viewedDeliveredOrders', JSON.stringify(newViewedOrders));
      }
    }
     if (status === 'return-requested') {
        const returnOrderIds = filteredOrders
            .filter(order => ['returned', 'return-rejected'].includes(order.status))
            .map(order => order.id);
        
        if (returnOrderIds.length > 0) {
            const viewedOrders = JSON.parse(localStorage.getItem('viewedReturnOrders') || '[]');
            const newViewedOrders = Array.from(new Set([...viewedOrders, ...returnOrderIds]));
            localStorage.setItem('viewedReturnOrders', JSON.stringify(newViewedOrders));
        }
    }
  }, [status, filteredOrders]);
    
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
          case 'return-processing':
              return <Badge className="bg-yellow-100 text-yellow-800 capitalize">Return Processing</Badge>;
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
                              <CardContent className="p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h2 className="text-lg font-bold">Order ID: #{order.orderNumber}</h2>
                                          <p className="text-sm text-muted-foreground">Placed on: {new Date(order.date).toLocaleDateString()}</p>
                                      </div>
                                      {getStatusBadge(order.status)}
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                      <div className="flex -space-x-4">
                                        {order.items.slice(0, 4).map((item, index) => (
                                            <div key={item.id + '-' + index} className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white">
                                                <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                                            </div>
                                        ))}
                                        {order.items.length > 4 && (
                                            <div className="relative h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold border-2 border-white">
                                                +{order.items.length - 4}
                                            </div>
                                        )}
                                      </div>
                                      <div className="text-right flex-grow">
                                        <span className="text-sm text-muted-foreground">Total Amount</span>
                                        <p className="font-bold text-lg">৳{order.total}</p>
                                      </div>
                                  </div>
                              </CardContent>
                            </div>
                            
                            {(order.status === 'delivered' || ['return-requested', 'return-processing', 'returned', 'return-rejected'].includes(order.status)) && (
                              <CardFooter className="bg-muted/30 p-2">
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        {order.status === 'return-processing' ? (
                                            <>
                                                <div /> 
                                                <ReturnInstructions />
                                            </>
                                        ) : order.status === 'delivered' || order.status === 'return-rejected' || order.status === 'returned' ? (
                                             <>
                                                <OrderReturnButton order={order} />
                                                {order.isReviewed ? (
                                                    <Button variant="outline" size="sm" disabled className="w-full bg-green-100 text-green-800 border-green-200">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Reviewed
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" asChild className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 border-green-200">
                                                        <Link href={`/account/reviews/new/${order.id}`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Write a Review
                                                        </Link>
                                                    </Button>
                                                )}
                                             </>
                                        ) : null}
                                    </div>
                              </CardFooter>
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
