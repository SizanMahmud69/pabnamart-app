
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, User as UserIcon, CreditCard, ShoppingBag, Info } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, DeliverySettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

const db = getFirestore(app);

export default function UserOrderDetailsPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [returnAddress, setReturnAddress] = useState<string | null>(null);
    const { toast } = useToast();
    const params = useParams();
    const orderId = params.id as string;
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!orderId || !user) return;

        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    const orderData = { id: orderDocSnap.id, ...orderDocSnap.data() } as Order;
                    
                    if (orderData.userId !== user.uid) {
                         toast({ title: "Access Denied", description: "You are not authorized to view this order.", variant: "destructive" });
                         router.push('/account/orders');
                         return;
                    }

                    setOrder(orderData);

                    if (orderData.status === 'return-processing') {
                         const settingsDocRef = doc(db, 'settings', 'delivery');
                         const settingsDocSnap = await getDoc(settingsDocRef);
                         if (settingsDocSnap.exists()) {
                             const settings = settingsDocSnap.data() as DeliverySettings;
                             setReturnAddress(settings.returnAddress || null);
                         }
                    }

                } else {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/account/orders');
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, toast, router, user]);


    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return null;
    }

    const isPaidOnline = order.paymentMethod === 'online' && order.status !== 'pending';
    const isPaidCOD = order.paymentMethod === 'cod' && order.status === 'delivered';
    const isPaid = isPaidOnline || isPaidCOD;
    
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = order.total + (order.voucherDiscount || 0) - subtotal;

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto p-4">
                <header className="py-4 flex justify-between items-center">
                    <Button asChild variant="outline">
                        <Link href="/account/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to My Orders
                        </Link>
                    </Button>
                </header>
                <main className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Order #{order.orderNumber}</span>
                                <Badge variant="secondary" className="capitalize text-base">{order.status.replace('-', ' ')}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Date: {new Date(order.date).toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    
                     {order.status === 'return-processing' && returnAddress && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="space-y-2">
                                <h3 className="font-bold">Return Instructions</h3>
                                <p>Please send the product(s) to the following address. Once we receive and verify the items, we will issue a voucher for the item's subtotal amount.</p>
                                <address className="not-italic p-2 bg-muted rounded-md text-foreground font-semibold">
                                    {returnAddress}
                                </address>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><UserIcon className="h-5 w-5" /> Shipping Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div>
                                    <h3 className="font-semibold mb-1">Shipping Address</h3>
                                    <address className="not-italic text-muted-foreground">
                                        {order.shippingAddress.fullName}<br />
                                        {order.shippingAddress.address}, {order.shippingAddress.area}<br />
                                        {order.shippingAddress.city}<br />
                                        {order.shippingAddress.phone}
                                    </address>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5" /> Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <p><strong>Method:</strong> <span className="capitalize">{order.paymentMethod}</span></p>
                                <div className="flex items-center justify-between">
                                    <p><strong>Status:</strong></p>
                                    {isPaid ? (
                                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                                    ) : order.paymentMethod === 'online' ? (
                                        <Badge variant="secondary">Pending Verification</Badge>
                                    ) : (
                                        <Badge variant="outline">Unpaid</Badge>
                                    )}
                                </div>
                                <p><strong>Total:</strong> <span className="font-bold text-foreground">৳{order.total}</span></p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Order Items ({order.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                           <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                                                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="50px" />
                                                    </div>
                                                    <span className="font-medium">{item.name}</span>
                                                </TableCell>
                                                <TableCell>x {item.quantity}</TableCell>
                                                <TableCell>৳{item.price}</TableCell>
                                                <TableCell className="text-right">৳{item.price * item.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                                            <TableCell className="text-right font-semibold">৳{subtotal}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right font-semibold">Shipping Fee</TableCell>
                                            <TableCell className="text-right font-semibold">৳{shippingFee > 0 ? shippingFee : 'Free'}</TableCell>
                                        </TableRow>
                                        {order.usedVoucherCode && order.voucherDiscount && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-right font-semibold text-primary">
                                                    Voucher ({order.usedVoucherCode})
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-primary">- ৳{order.voucherDiscount}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="text-lg font-bold">
                                            <TableCell colSpan={3} className="text-right">Total</TableCell>
                                            <TableCell className="text-right">৳{order.total}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                           </div>
                            <div className="absolute bottom-4 right-4">
                                {isPaid ? (
                                    <div className="flex items-center justify-center w-32 h-32 border-4 border-green-500 rounded-full">
                                        <span className="text-3xl font-bold text-green-500 transform -rotate-12">Paid</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-32 h-32 border-4 border-red-500 rounded-full">
                                        <span className="text-3xl font-bold text-red-500 transform -rotate-12">Unpaid</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
