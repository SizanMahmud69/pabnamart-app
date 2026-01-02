
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, MoreHorizontal, Eye, XCircle, Trash2, Loader2, Info } from 'lucide-react';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';


const db = getFirestore(app);

export default function VerifyPaymentsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


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

    const handleUpdateStatus = async (orderId: string, status: 'processing' | 'cancelled') => {
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status });
            toast({
                title: "Order Updated",
                description: `Order status has been updated to ${status}.`
            });
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to update order status.`,
                variant: "destructive"
            });
        }
    };
    
    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'orders', orderToDelete.id));
            toast({
                title: "Order Deleted",
                description: `Order #${orderToDelete.orderNumber} has been deleted.`
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete order.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
            setOrderToDelete(null);
        }
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
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
                        <CardTitle>Verify Online Payments</CardTitle>
                        <CardDescription>Review and verify payments for pending online orders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {orders.length > 0 ? orders.map(order => (
                            <Card key={order.id} className="shadow-md">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                        <CardDescription>{new Date(order.date).toLocaleString()} by {users[order.userId]?.displayName || '...'}</CardDescription>
                                         <Badge variant="secondary" className="capitalize mt-2">{order.paymentMethod}</Badge>
                                    </div>
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
                                                <span>Details</span>
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'processing')}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span>Verify</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleUpdateStatus(order.id, 'cancelled')}>
                                                <XCircle className="mr-2 h-4 w-4" />
                                                <span>Cancel</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onSelect={() => setOrderToDelete(order)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                                <Separator />
                                 <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-xl font-bold">৳{order.total.toFixed(2)}</p>
                                    </div>
                                    <Button onClick={() => handleUpdateStatus(order.id, 'processing')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Verify Payment
                                    </Button>
                                </CardFooter>
                            </Card>
                        )) : (
                           <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">All Caught Up!</h3>
                                <p className="text-muted-foreground">There are no pending online payments to verify.</p>
                            </div>
                        )}
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
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
}
