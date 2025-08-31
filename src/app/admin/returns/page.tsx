
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MoreHorizontal, FileText } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { collection, query, where, onSnapshot, getFirestore, doc, updateDoc, setDoc, getDoc, arrayUnion, addDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, Voucher, Notification } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

async function createReturnNotification(userId: string, orderNumber: string, status: 'approved' | 'rejected') {
    if (!userId) return;
    const notification: Omit<Notification, 'id'> = {
        icon: status === 'approved' ? 'CheckCircle' : 'XCircle',
        title: `Return Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `Your return request for order #${orderNumber} has been ${status}.`,
        time: new Date().toISOString(),
        read: false,
        href: status === 'approved' ? '/account/vouchers' : `/account/orders?status=return-rejected`
    };
    await addDoc(collection(db, `users/${userId}/pendingNotifications`), notification);
}

export default function AdminReturnManagement() {
  const [returnRequests, setReturnRequests] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', 'in', ['return-requested', 'returned', 'return-rejected']));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setReturnRequests(requests);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (order: Order, status: 'returned' | 'return-rejected') => {
    const orderDoc = doc(db, 'orders', order.id);
    await updateDoc(orderDoc, { status });

    if (status === 'returned') {
      const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      
      const voucherCode = `RET-${order.orderNumber}`;
      const newVoucher: Voucher = {
        code: voucherCode,
        discount: subtotal,
        type: 'fixed',
        description: `Return credit for order #${order.orderNumber}`,
        discountType: 'order',
        isReturnVoucher: true,
      };

      const availableVouchersRef = doc(db, 'availableReturnVouchers', order.userId);
       try {
            const docSnap = await getDoc(availableVouchersRef);
            if (docSnap.exists()) {
                 await updateDoc(availableVouchersRef, {
                    vouchers: arrayUnion(newVoucher)
                });
            } else {
                await setDoc(availableVouchersRef, { vouchers: [newVoucher] });
            }
           
            await createReturnNotification(order.userId, order.orderNumber, 'approved');
            toast({
                title: "Return Approved",
                description: `A voucher for ৳${subtotal} has been made available to the user.`
            });

        } catch (error) {
            console.error("Error creating voucher:", error);
            toast({
                title: "Error",
                description: "Failed to create return voucher.",
                variant: "destructive"
            });
        }
    } else {
        await createReturnNotification(order.userId, order.orderNumber, 'rejected');
        toast({
            title: "Return Rejected",
            description: `The return request for order #${order.orderNumber} has been rejected.`
        });
    }
  };

  if (loading) {
      return <LoadingSpinner />
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
                    <CardTitle>Return Requests</CardTitle>
                    <CardDescription>Manage and process return requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returnRequests.length > 0 ? returnRequests.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell>#{request.orderNumber}</TableCell>
                                    <TableCell>{request.shippingAddress.fullName}</TableCell>
                                    <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {request.status === 'return-requested' ? (
                                            <Badge variant='secondary'>Pending</Badge>
                                        ) : request.status === 'returned' ? (
                                            <Badge className="bg-green-100 text-green-800 capitalize">{request.status}</Badge>
                                        ) : (
                                            <Badge variant='destructive' className="capitalize">Rejected</Badge>
                                        )}
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
                                                <DropdownMenuItem onSelect={() => router.push(`/admin/returns/${request.id}`)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    <span>Return Details</span>
                                                </DropdownMenuItem>
                                                {request.status === 'return-requested' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(request, 'returned')}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                            <span>Approve</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onSelect={() => handleStatusChange(request, 'return-rejected')}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            <span>Reject</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        No pending return requests.
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
