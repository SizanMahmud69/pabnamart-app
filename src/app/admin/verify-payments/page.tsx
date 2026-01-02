"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);

export default function VerifyPaymentsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const ordersQuery = query(
            collection(db, 'orders'), 
            where('paymentMethod', '!=', 'cash-on-delivery'),
            where('status', '==', 'pending'),
            orderBy('paymentMethod'),
            orderBy('date', 'desc')
        );
        
        const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(ordersData);
            setLoading(false);

            const userIds = new Set(ordersData.map(order => order.userId));
            userIds.forEach(userId => {
                if (!users[userId]) {
                    const userDocRef = doc(db, 'users', userId);
                    onSnapshot(userDocRef, (userDoc) => {
                        if (userDoc.exists()) {
                            setUsers(prevUsers => ({ ...prevUsers, [userId]: userDoc.data() as User }));
                        }
                    });
                }
            });

        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => ordersUnsubscribe();
    }, [users]);

    const handleVerifyPayment = async (orderId: string) => {
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status: 'processing' });
            toast({
                title: "Payment Verified",
                description: "Order status updated to processing."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to verify payment.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            <main>
                <Card>
                    <CardHeader>
                        <CardTitle>Verify Online Payments</CardTitle>
                        <CardDescription>Review and verify payments for pending online orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                        <TableCell>{users[order.userId]?.displayName || 'Loading...'}</TableCell>
                                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                        <TableCell>৳{order.total.toFixed(2)}</TableCell>
                                        <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                                        <TableCell className="font-mono">{order.transactionId || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleVerifyPayment(order.id)}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Verify
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            No pending online payments to verify.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
