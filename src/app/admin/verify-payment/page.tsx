
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, MoreHorizontal, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Order, User as AppUser } from '@/types';
import { collection, doc, getDoc, onSnapshot, getFirestore, updateDoc, query, where, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

export default function VerifyPaymentPage() {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<Map<string, AppUser>>(new Map());
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef, 
            where('paymentMethod', '==', 'online'), 
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            
            const userIds = new Set(ordersData.map(order => order.userId));
            const usersMap = new Map<string, AppUser>();
            
            for (const userId of userIds) {
                if (!users.has(userId)) {
                    const userDocRef = doc(db, 'users', userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        usersMap.set(userId, userDocSnap.data() as AppUser);
                    }
                } else {
                    usersMap.set(userId, users.get(userId)!);
                }
            }
            
            setUsers(prev => new Map([...prev, ...usersMap]));
            setPendingOrders(ordersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [users]);

    const sortedOrders = useMemo(() => {
        return [...pendingOrders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [pendingOrders]);

    const handleVerifyPayment = async (orderId: string) => {
        try {
            const orderDocRef = doc(db, 'orders', orderId);
            await updateDoc(orderDocRef, { status: 'shipped' });
            toast({
                title: "Payment Verified",
                description: "The order has been moved to 'To Ship'.",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to verify payment.",
                variant: "destructive",
            });
            console.error("Error verifying payment: ", error);
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
                        <CardDescription>Review and verify pending payments made online.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedOrders.length > 0 ? (
                                    sortedOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{users.get(order.userId)?.displayName || 'Unknown User'}</TableCell>
                                            <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                            <TableCell>৳{order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => router.push(`/admin/orders/${order.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleVerifyPayment(order.id)}>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Verify Payment
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No pending payments to verify.
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
