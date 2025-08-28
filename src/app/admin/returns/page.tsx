
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, query, where, onSnapshot, getFirestore, doc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

export default function AdminReturnManagement() {
  const [returnRequests, setReturnRequests] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', 'return-requested'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setReturnRequests(requests);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, status: 'returned' | 'shipped') => {
    const orderDoc = doc(db, 'orders', orderId);
    await updateDoc(orderDoc, { status });
    // In a real app, you would also generate a voucher here if approved.
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
                                        <Badge variant='secondary'>Pending</Badge>
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
                                                <DropdownMenuItem onSelect={() => handleStatusChange(request.id, 'returned')}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                    <span>Approve</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-destructive"
                                                    onSelect={() => handleStatusChange(request.id, 'shipped')}
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    <span>Reject</span>
                                                </DropdownMenuItem>
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
