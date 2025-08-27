
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

type ReturnStatus = 'Pending' | 'Approved' | 'Rejected';

const mockReturns = [
  { id: 'R001', orderId: '12349', customer: 'Alice Brown', date: '2023-10-15', status: 'Pending' as ReturnStatus },
  { id: 'R002', orderId: '12340', customer: 'Bob White', date: '2023-10-12', status: 'Approved' as ReturnStatus },
  { id: 'R003', orderId: '12333', customer: 'Charlie Green', date: '2023-10-10', status: 'Rejected' as ReturnStatus },
];

export default function AdminReturnManagement() {
  const [returns, setReturns] = useState(mockReturns);

  const handleStatusChange = (id: string, status: ReturnStatus) => {
    setReturns(returns.map(r => r.id === id ? { ...r, status } : r));
  };

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
                                <TableHead>Request ID</TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.map(request => (
                                <TableRow key={request.id}>
                                    <TableCell className="font-medium">{request.id}</TableCell>
                                    <TableCell>#{request.orderId}</TableCell>
                                    <TableCell>{request.customer}</TableCell>
                                    <TableCell>{request.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            request.status === 'Approved' ? 'default' : 
                                            request.status === 'Rejected' ? 'destructive' : 'secondary'
                                        }>{request.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {request.status === 'Pending' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleStatusChange(request.id, 'Approved')}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                        <span>Approve</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-destructive"
                                                        onSelect={() => handleStatusChange(request.id, 'Rejected')}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        <span>Reject</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
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
