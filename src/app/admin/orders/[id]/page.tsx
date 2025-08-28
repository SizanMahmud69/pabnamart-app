
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User as UserIcon, Mail, MapPin, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User as AppUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const db = getFirestore(app);

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

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return null;
    }

    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline">
                    <Link href="/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order List
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Order #{order.id}</span>
                             <Badge variant="secondary" className="capitalize text-base">{order.status}</Badge>
                        </CardTitle>
                        <CardDescription>
                            Date: {new Date(order.date).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><UserIcon className="h-5 w-5" /> Customer Details</h3>
                            <div className="text-sm text-muted-foreground">
                                <p><strong>Name:</strong> {customer?.displayName || 'N/A'}</p>
                                <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5" /> Shipping Address</h3>
                            <div className="text-sm text-muted-foreground">
                                <p>{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                                <p>{order.shippingAddress.city}</p>
                                <p>{order.shippingAddress.phone}</p>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Details</h3>
                            <div className="text-sm text-muted-foreground">
                                <p><strong>Method:</strong> <span className="capitalize">{order.paymentMethod}</span></p>
                                <p><strong>Total:</strong> <span className="font-bold text-foreground">৳{order.total.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Order Items ({order.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
