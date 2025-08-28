
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, User as UserIcon, Mail, MapPin, CreditCard, ShoppingBag, Download, CircleDollarSign } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User as AppUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const db = getFirestore(app);

const Stamp = ({ text, colorClass }: { text: string; colorClass: string }) => (
    <div className="w-28 h-28 flex-shrink-0 hidden md:flex items-center justify-center">
        <div className={cn(
            "w-28 h-28 rounded-full border-4 flex items-center justify-center opacity-20 pointer-events-none rotate-12",
            colorClass
        )}>
            <span className="text-3xl font-bold uppercase">{text}</span>
        </div>
    </div>
);


export default function OrderDetailsPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const params = useParams();
    const orderId = params.id as string;
    const router = useRouter();

    useEffect(() => {
        if (!orderId) return;

        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    const orderData = { id: orderDocSnap.id, ...orderDocSnap.data() } as Order;
                    setOrder(orderData);

                    // Fetch customer data
                    const userDocRef = doc(db, 'users', orderData.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setCustomer(userDocSnap.data() as AppUser);
                    }
                } else {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/admin/orders');
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, toast, router]);

    const handlePrint = () => {
        window.print();
    }

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
    const shippingFee = order.total - subtotal;

    return (
        <div className="container mx-auto p-4">
            <header className="py-4 flex justify-between items-center print:hidden">
                <Button asChild variant="outline">
                    <Link href="/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order List
                    </Link>
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Order #{order.orderNumber}</span>
                             <Badge variant="secondary" className="capitalize text-base">{order.status}</Badge>
                        </CardTitle>
                        <CardDescription>
                            Date: {new Date(order.date).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><UserIcon className="h-5 w-5" /> Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <p><strong>Name:</strong> {customer?.displayName || 'N/A'}</p>
                            <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                            <div>
                                <h3 className="font-semibold mt-4 mb-1">Shipping Address</h3>
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
                                     <Badge variant="outline">Cash on Delivery</Badge>
                                )}
                            </div>
                            <p><strong>Total:</strong> <span className="font-bold text-foreground">৳{order.total.toFixed(2)}</span></p>
                             {order.paymentMethod === 'online' && order.paymentDetails && (
                                <div className="pt-2 border-t mt-2 space-y-1">
                                    <h4 className="font-semibold text-foreground">Payment Info</h4>
                                    <p><strong>Gateway:</strong> {order.paymentDetails.gateway}</p>
                                    <p><strong>Transaction ID:</strong> {order.paymentDetails.transactionId}</p>
                                    <p><strong>Payer Number:</strong> {order.paymentDetails.payerNumber}</p>
                                    <p><strong>Merchant Number:</strong> {order.paymentDetails.merchantNumber}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Order Items ({order.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-start gap-8">
                            <div className="flex-grow">
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
                                                <TableCell>৳{item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">৳{(item.price * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                                            <TableCell className="text-right font-semibold">৳{subtotal.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right font-semibold">Shipping Fee</TableCell>
                                            <TableCell className="text-right font-semibold">৳{shippingFee.toFixed(2)}</TableCell>
                                        </TableRow>
                                        <TableRow className="text-lg font-bold">
                                            <TableCell colSpan={3} className="text-right">Total</TableCell>
                                            <TableCell className="text-right">৳{order.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                            {isPaid ? (
                                <Stamp text="Paid" colorClass="border-green-500 text-green-500" />
                            ) : (
                                <Stamp text="Unpaid" colorClass="border-red-500 text-red-500" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );

    