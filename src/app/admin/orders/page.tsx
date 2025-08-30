
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Truck, PackageCheck, MoreHorizontal, CircleDollarSign, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Order, OrderStatus, User as AppUser, Notification } from '@/types';
import { collection, doc, getDoc, onSnapshot, getFirestore, updateDoc, query, orderBy, addDoc, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);

async function createNotification(userId: string, orderNumber: string, status: OrderStatus) {
    if (!userId) return;
    const notification: Omit<Notification, 'id'> = {
        icon: 'Truck',
        title: `Order #${orderNumber} is now ${status.replace('-', ' ')}`,
        description: `Your order has been updated. You can track its progress in your account.`,
        time: new Date().toISOString(),
        read: false,
        href: `/account/orders?status=${status}`
    };
    await addDoc(collection(db, `users/${userId}/pendingNotifications`), notification);
}

const TABS = [
    { value: 'all', label: 'All' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'in-transit', label: 'In-Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'returned', label: 'Returned' },
];

export default function AdminOrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<Map<string, AppUser>>(new Map());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const ordersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Order))
                .filter(order => !(order.paymentMethod === 'online' && order.status === 'pending')); // Filter out pending online orders
            
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

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
        const orderDocRef = doc(db, 'orders', order.id);
        const updateData: { status: OrderStatus; deliveryDate?: string } = { status: newStatus };
        
        if (newStatus === 'delivered') {
            updateData.deliveryDate = new Date().toISOString();
        }

        await updateDoc(orderDocRef, updateData);
        await createNotification(order.userId, order.orderNumber, newStatus);
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'orders', orderToDelete.id));
            toast({
                title: "Order Deleted",
                description: `Order #${orderToDelete.orderNumber} has been successfully deleted.`,
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "Failed to delete the order.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setOrderToDelete(null);
        }
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

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') {
            return orders;
        }
        if (activeTab === 'returned') {
            return orders.filter(order => order.status === 'returned' || order.status === 'return-requested' || order.status === 'return-rejected');
        }
        return orders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
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
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList>
                                    {TABS.map(tab => (
                                        <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <TabsContent value={activeTab} className="mt-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Payment</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredOrders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                                    <TableCell>{users.get(order.userId)?.displayName || 'Unknown User'}</TableCell>
                                                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>৳{order.total}</TableCell>
                                                    <TableCell>
                                                        {order.paymentMethod === 'online' ? (
                                                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                                                        ) : (
                                                            <Badge variant="outline">COD</Badge>
                                                        )}
                                                    </TableCell>
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
                                                                    <DropdownMenuItem onSelect={() => handleStatusChange(order, 'shipped')}>
                                                                        <Truck className="mr-2 h-4 w-4" />
                                                                        Mark as Shipped
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'shipped' && (
                                                                    <DropdownMenuItem onSelect={() => handleStatusChange(order, 'in-transit')}>
                                                                        <Truck className="mr-2 h-4 w-4" />
                                                                        Mark as In-Transit
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {order.status === 'in-transit' && (
                                                                    <DropdownMenuItem onSelect={() => handleStatusChange(order, 'delivered')}>
                                                                        <PackageCheck className="mr-2 h-4 w-4" />
                                                                        Mark as Delivered
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="text-destructive"
                                                                    onSelect={() => setOrderToDelete(order)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {filteredOrders.length === 0 && (
                                        <div className="text-center py-10">
                                            <p>No orders found for this status.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </main>
            </div>
            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete order #{orderToDelete?.orderNumber}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOrder} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDeleting ? "Deleting..." : "Continue"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
