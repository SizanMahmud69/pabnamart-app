"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Eye, Ban, CheckCircle, Truck, RefreshCw, XCircle, Undo2, Loader2, PackageCheck, Gift } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where, writeBatch, arrayUnion } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User, Voucher } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createAndSendNotification } from '@/app/actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const db = getFirestore(app);

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'processing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': return 'default';
        case 'cancelled': return 'destructive';
        case 'returned': return 'destructive';
        case 'return-requested': return 'secondary';
        case 'return-approved': return 'default';
        case 'return-shipped': return 'default';
        case 'return-denied': return 'destructive';
        default: return 'outline';
    }
};

const statusTabs: (Order['status'])[] = ['return-requested', 'return-approved', 'return-shipped', 'returned', 'return-denied'];

export default function AdminReturnManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<(Order['status'])>('return-requested');
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const ordersQuery = query(
            collection(db, 'orders'), 
            where('status', 'in', statusTabs), 
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
            console.error("Error fetching return orders: ", error);
            setLoading(false);
        });

        return () => ordersUnsubscribe();
    }, [users]);
    
    const handleApproveRequest = async (order: Order) => {
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: 'return-approved' });
            await createAndSendNotification(order.userId, {
                icon: 'CheckCircle',
                title: 'Return Request Approved',
                description: `Your return for order #${order.orderNumber} is approved. Please ship the item back.`,
                href: `/account/returns?orderId=${order.id}`
            });
            toast({ title: "Return Approved", description: "User has been notified to ship the item." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to approve return request.", variant: "destructive" });
        }
    };
    
    const handleDeclineRequest = async (order: Order, isFinalDecline: boolean) => {
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: 'return-denied' });
            
            await createAndSendNotification(order.userId, {
                icon: 'XCircle',
                title: 'Return Request Denied',
                description: `Your return for order #${order.orderNumber} was not approved.`,
                href: `/account/orders/${order.id}`
            });

            toast({ title: "Return Denied", description: "The return request has been denied." });
        } catch (error) {
             toast({ title: "Error", description: "Failed to deny return.", variant: "destructive" });
        }
    }

    const handleFinalizeReturn = async (order: Order) => {
        const batch = writeBatch(db);
        const orderRef = doc(db, 'orders', order.id);

        try {
            // 1. Update order status to 'returned'
            batch.update(orderRef, { status: 'returned' });

            // 2. Create a return voucher
            const returnVoucherCode = `RET${order.orderNumber}`;
            const returnVoucher: Voucher = {
                id: returnVoucherCode,
                code: returnVoucherCode,
                discount: order.total,
                type: 'fixed',
                description: `Return credit for order #${order.orderNumber}`,
                minSpend: order.total + 1,
                isReturnVoucher: true,
                usageLimit: 1,
                createdAt: new Date().toISOString(),
            };
            
            // 3. Make voucher available for user to collect
            const availableVoucherRef = doc(db, 'availableReturnVouchers', order.userId);
            batch.set(availableVoucherRef, {
                vouchers: arrayUnion(returnVoucher)
            }, { merge: true });

            await batch.commit();

            await createAndSendNotification(order.userId, {
                icon: 'Gift',
                title: 'Return Complete',
                description: `Your return for #${order.orderNumber} is complete. A voucher is available to collect.`,
                href: '/vouchers'
            });

            toast({
                title: "Return Finalized",
                description: `A return voucher has been made available to the user.`
            });
        } catch (error) {
            console.error("Error finalizing return:", error);
            toast({
                title: "Error",
                description: "Failed to finalize return.",
                variant: "destructive"
            });
        }
    }

    const filteredOrders = useMemo(() => {
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
                        <CardTitle>Return Requests</CardTitle>
                        <CardDescription>Manage customer return requests and approvals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Order['status'])}>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                                <TabsList className="inline-flex w-max mb-4">
                                    {statusTabs.map(tab => (
                                        <TabsTrigger key={tab} value={tab} className="capitalize">{tab.replace('-', ' ')}</TabsTrigger>
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
                                                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status.replace('-', ' ')}</Badge>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem onSelect={() => router.push(`/admin/orders/${order.id}`)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    <span>View Details</span>
                                                                </DropdownMenuItem>
                                                                {order.status === 'return-requested' && (
                                                                    <>
                                                                        <DropdownMenuItem onSelect={() => handleApproveRequest(order)}>
                                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                                            <span>Approve Request</span>
                                                                        </DropdownMenuItem>
                                                                         <DropdownMenuItem onSelect={() => handleDeclineRequest(order, false)} className="text-destructive">
                                                                            <XCircle className="mr-2 h-4 w-4" />
                                                                            <span>Decline Request</span>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {order.status === 'return-shipped' && (
                                                                    <>
                                                                         <DropdownMenuItem onSelect={() => handleFinalizeReturn(order)}>
                                                                            <PackageCheck className="mr-2 h-4 w-4" />
                                                                            <span>Finalize Return</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onSelect={() => handleDeclineRequest(order, true)} className="text-destructive">
                                                                            <XCircle className="mr-2 h-4 w-4" />
                                                                            <span>Reject Item</span>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm font-semibold">Total Amount: <span className="font-bold text-lg">৳{order.total.toFixed(2)}</span></p>
                                                </CardContent>
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
