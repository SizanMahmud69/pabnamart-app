"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Eye, Ban, CheckCircle, Truck, RefreshCw, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { createAndSendNotification } from '@/app/actions';

const db = getFirestore(app);

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

const statusTabs: Order['status'][] = ['processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const allStatusTabs = ['all', ...statusTabs];
const statusChangeOptions: Order['status'][] = ['cancelled', 'processing', 'shipped', 'delivered', 'returned'];


export default function AdminOrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        const ordersQuery = query(collection(db, 'orders'), orderBy('date', 'desc'));
        const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(ordersData);
            setLoading(false);

            // Fetch users for the new orders
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

    const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: newStatus });

            let notificationData;
            switch (newStatus) {
                case 'processing':
                    notificationData = {
                        icon: 'PackageCheck',
                        title: 'Order is being processed',
                        description: `Your order #${order.orderNumber} is now being processed.`
                    };
                    break;
                case 'shipped':
                    notificationData = {
                        icon: 'Truck',
                        title: 'Order Shipped',
                        description: `Your order #${order.orderNumber} has been shipped.`
                    };
                    break;
                case 'delivered':
                    notificationData = {
                        icon: 'CheckCircle',
                        title: 'Order Delivered',
                        description: `Your order #${order.orderNumber} has been delivered.`
                    };
                    break;
                case 'cancelled':
                    notificationData = {
                        icon: 'XCircle',
                        title: 'Order Cancelled',
                        description: `Your order #${order.orderNumber} has been cancelled.`
                    };
                    break;
                case 'returned':
                    notificationData = {
                        icon: 'PackageCheck',
                        title: 'Order Returned',
                        description: `Your order #${order.orderNumber} has been marked as returned.`
                    };
                    break;
                default:
                    notificationData = null;
            }
            
            let toastDescription = `Order has been marked as ${newStatus}.`;

            if (notificationData) {
                await createAndSendNotification(order.userId, {
                    ...notificationData,
                    href: `/account/orders/${order.id}`
                });
                toastDescription += " A notification has been sent to the user.";
            }

            toast({
                title: "Order Status Updated",
                description: toastDescription
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            toast({
                title: "Error",
                description: "Failed to update order status.",
                variant: "destructive"
            });
        }
    };
    
    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') {
            return orders.filter(order => order.status !== 'pending');
        }
        return orders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
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
                        <CardDescription>View, manage, and process all customer orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                                <TabsList className="inline-flex w-max mb-4">
                                    {allStatusTabs.map(tab => (
                                        <TabsTrigger key={tab} value={tab} className="capitalize">{tab}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <TabsContent value={activeTab} className="mt-4">
                               {filteredOrders.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredOrders.map(order => (
                                             <Card key={order.id} className="shadow-md">
                                                <CardHeader className="flex flex-row items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                                        <CardDescription>{new Date(order.date).toLocaleString()} by {users[order.userId]?.displayName || '...'}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
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
                                                                    <span>View Details</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSub>
                                                                    <DropdownMenuSubTrigger>
                                                                        <span>Change Status</span>
                                                                    </DropdownMenuSubTrigger>
                                                                    <DropdownMenuPortal>
                                                                        <DropdownMenuSubContent>
                                                                            {statusChangeOptions.map(status => (
                                                                                <DropdownMenuItem key={status} onSelect={() => handleStatusChange(order, status)} className="capitalize">
                                                                                    {status}
                                                                                </DropdownMenuItem>
                                                                            ))}
                                                                        </DropdownMenuSubContent>
                                                                    </DropdownMenuPortal>
                                                                </DropdownMenuSub>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex items-center gap-4 py-2">
                                                            <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover border" />
                                                            <div className="flex-grow">
                                                                <p className="font-semibold text-sm">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                                            </div>
                                                            <p className="font-semibold text-sm">৳{item.price * item.quantity}</p>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                                <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                                                    <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                                        <p className="text-xl font-bold">৳{order.total.toFixed(2)}</p>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                               ) : (
                                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No orders found for this status.</p>
                                    </div>
                               )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
