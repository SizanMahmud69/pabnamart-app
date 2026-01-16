"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Eye, Ban, CheckCircle, Truck, RefreshCw, XCircle, Undo2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where, writeBatch, addDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User, Voucher } from '@/types';
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
        case 'return-requested': return 'secondary';
        case 'return-approved': return 'default';
        default: return 'outline';
    }
};

const statusTabs: (Order['status'])[] = ['return-requested', 'return-approved', 'returned'];

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
            where('status', 'in', ['return-requested', 'return-approved', 'returned']), 
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
    
    const handleApproveReturn = async (order: Order) => {
        const orderRef = doc(db, 'orders', order.id);
        const batch = writeBatch(db);

        try {
            // 1. Update order status
            batch.update(orderRef, { status: 'return-approved' });

            // 2. Create a return voucher
            const returnVoucherCode = `RET${order.orderNumber}`;
            const returnVoucher: Omit<Voucher, 'id'> = {
                code: returnVoucherCode,
                discount: order.total,
                type: 'fixed',
                description: `Return credit for order #${order.orderNumber}`,
                minSpend: order.total + 1,
                isReturnVoucher: true,
                usageLimit: 1,
                createdAt: new Date().toISOString(),
            };
            const voucherRef = doc(db, 'vouchers', returnVoucherCode);
            batch.set(voucherRef, returnVoucher);

            // 3. Add voucher to user's available return vouchers
            const availableVouchersRef = doc(db, 'availableReturnVouchers', order.userId);
            batch.set(availableVouchersRef, {
                vouchers: [returnVoucher]
            }, { merge: true });

            await batch.commit();

            await createAndSendNotification(order.userId, {
                icon: 'CheckCircle',
                title: 'Return Request Approved',
                description: `Your return request for order #${order.orderNumber} has been approved. A voucher has been issued.`,
                href: '/account/vouchers'
            });

            toast({
                title: "Return Approved",
                description: `Order return approved and a voucher has been issued to the user.`
            });
        } catch (error) {
            console.error("Error approving return:", error);
            toast({
                title: "Error",
                description: "Failed to approve return.",
                variant: "destructive"
            });
        }
    };
    
    const handleDeclineReturn = async (order: Order) => {
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: 'delivered' });
            
            await createAndSendNotification(order.userId, {
                icon: 'XCircle',
                title: 'Return Request Declined',
                description: `Your return request for order #${order.orderNumber} has been declined.`,
                href: `/account/orders/${order.id}`
            });

            toast({
                title: "Return Declined",
                description: "The return request has been declined."
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to decline return.",
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
                            <TabsList className="inline-flex w-max mb-4">
                                {statusTabs.map(tab => (
                                    <TabsTrigger key={tab} value={tab} className="capitalize">{tab.replace('-', ' ')}</TabsTrigger>
                                ))}
                            </TabsList>
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
                                                                        <DropdownMenuItem onSelect={() => handleApproveReturn(order)}>
                                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                                            <span>Approve Return</span>
                                                                        </DropdownMenuItem>
                                                                         <DropdownMenuItem onSelect={() => handleDeclineReturn(order)} className="text-destructive">
                                                                            <XCircle className="mr-2 h-4 w-4" />
                                                                            <span>Decline Return</span>
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
