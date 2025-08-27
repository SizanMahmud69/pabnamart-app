
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Truck, PackageCheck, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { OrderStatus } from '@/types';

const mockOrders = [
  { id: '12345', customer: 'John Doe', date: '2023-10-26', total: 450, status: 'pending' as OrderStatus },
  { id: '12346', customer: 'Jane Smith', date: '2023-10-25', total: 250, status: 'shipped' as OrderStatus },
  { id: '12347', customer: 'Mike Johnson', date: '2023-10-24', total: 150, status: 'delivered' as OrderStatus },
  { id: '12348', customer: 'Alice Brown', date: '2023-10-23', total: 300, status: 'in-transit' as OrderStatus },
  { id: '12349', customer: 'Bob White', date: '2023-10-22', total: 120, status: 'returned' as OrderStatus },
];

export default function AdminOrderManagement() {
    const [orders, setOrders] = useState(mockOrders);

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        ));
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
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>{order.date}</TableCell>
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
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {order.status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Mark as Shipped
                                                        </DropdownMenuItem>
                                                    )}
                                                     {order.status === 'shipped' && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'in-transit')}>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            Mark as In-Transit
                                                        </DropdownMenuItem>
                                                    )}
                                                     {order.status === 'in-transit' && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
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
