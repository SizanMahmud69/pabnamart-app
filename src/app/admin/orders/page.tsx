
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Truck, PackageCheck, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Order, OrderStatus, User as AppUser } from '@/types';
import { collection, doc, getDoc, onSnapshot, getFirestore, updateDoc, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

export default function AdminOrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<Map<string, AppUser>>(new Map());
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const ordersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .filter(order => !(order.paymentMethod === 'online' && order.status === 'pending')); // Filter out pending online orders
            
            // Fetch user data for each order
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
            setOrders(ordersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [users]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        const orderDocRef = doc(db, 'orders', orderId);
        await updateDoc(orderDocRef, { status: newStatus });
    };
    
    const getStatusBadgeVariant = (status: OrderStatus) => {
        switch(status) {
            case 'pending': return 'secondary';
            case 'shipped': return 'default';
            case 'in-transit': return 'default';
            case 'delivered': return 'default';
            case 'returned': return 'destructive';
            default: return 'outline';
        }
    }

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
                        <CardTitle>Order Management</CardTitle>
                        <CardDescription>Track and process customer orders.</CardDescription>
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
                                {orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id}</TableCell>
                                        <TableCell>{users.get(order.userId)?.displayName || 'Unknown User'}</TableCell>
                                        <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                        <TableCell>৳{order.total.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">{order.status}</Badge>
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
                                                    {order.status === 'pending' && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'shipped')}>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Mark as Shipped
                                                        </DropdownMenuItem>
                                                    )}
                                                     {order.status === 'shipped' && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'in-transit')}>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Mark as In-Transit
                                                        </DropdownMenuItem>
                                                    )}
                                                     {order.status === 'in-transit' && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(order.id, 'delivered')}>
                                                            <PackageCheck className="mr-2 h-4 w-4" />
                                                            Mark as Delivered
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
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
