
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { withAuth, useAuth } from '@/hooks/useAuth';
import type { Order } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Truck, Calendar, Hash, CreditCard, Ticket, CheckCircle, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusStepper from '@/components/OrderStatusStepper';

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

function OrderDetailsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !orderId) return;

        const orderRef = doc(getFirestore(app), 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                const orderData = { ...docSnap.data(), id: docSnap.id } as Order;
                if (orderData.userId === user.uid) {
                    setOrder(orderData);
                } else {
                    router.replace('/account/orders');
                }
            } else {
                router.replace('/account/orders');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, orderId, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Order not found</h2>
                <Button asChild variant="link">
                    <Link href="/account/orders">Back to My Orders</Link>
                </Button>
            </div>
        );
    }
    
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to My Orders
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Order #{order.orderNumber}</CardTitle>
                                <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(order.status)} className="capitalize text-lg">{order.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <OrderStatusStepper currentStatus={order.status} />

                        <Separator />
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                            {order.items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 py-3">
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

                        <div className="space-y-4">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>৳{subtotal.toFixed(2)}</span>
                            </div>
                            {order.voucherDiscount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Voucher Discount</span>
                                    <span className="text-green-600">- ৳{order.voucherDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping Fee</span>
                                <span>৳{order.shippingFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total</span>
                                <span>৳{order.total}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Shipping & Payment</h3>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Shipping Address</p>
                                    <p className="text-muted-foreground text-sm">
                                        {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.area}, {order.shippingAddress.city}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Payment Method</p>
                                    <p className="text-muted-foreground text-sm capitalize">{order.paymentMethod}</p>
                                </div>
                            </div>
                             {order.paymentMethod !== 'cash-on-delivery' && (
                                <>
                                    {order.paymentAccountNumber && (
                                        <div className="flex items-start gap-3">
                                            <Smartphone className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Payment From</p>
                                                <p className="text-muted-foreground text-sm">{order.paymentAccountNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    {order.transactionId && (
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Transaction ID</p>
                                                <p className="text-muted-foreground text-sm">{order.transactionId}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(OrderDetailsPage);
