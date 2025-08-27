
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const mockVouchers = [
  { id: '1', code: 'PABNA50', type: 'Fixed', value: '৳50', status: 'Active', minSpend: '৳500' },
  { id: '2', code: 'FREESHIP', type: 'Fixed', value: '৳50', status: 'Active', minSpend: 'N/A' },
  { id: '3', code: 'NEW100', type: 'Fixed', value: '৳100', status: 'Active', minSpend: 'N/A' },
  { id: '4', code: 'OLDVOUCHER', type: 'Percentage', value: '10%', status: 'Expired', minSpend: '৳1000' },
];

export default function AdminVoucherManagement() {
  const [vouchers, setVouchers] = useState(mockVouchers);

  const handleDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this voucher?')) {
        setVouchers(vouchers.filter(voucher => voucher.id !== id));
    }
  }

  return (
    <div className="container mx-auto p-4">
        <header className="py-4 flex justify-between items-center">
            <Button asChild variant="outline" size="xs">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Button asChild size="xs">
                <Link href="/admin/vouchers/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Voucher
                </Link>
            </Button>
        </header>
        <main>
            <Card>
                <CardHeader>
                    <CardTitle>Voucher Management</CardTitle>
                    <CardDescription>Create and distribute vouchers for your customers.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Voucher Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Min. Spend</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vouchers.map(voucher => (
                                <TableRow key={voucher.id}>
                                    <TableCell className="font-mono">{voucher.code}</TableCell>
                                    <TableCell>{voucher.type}</TableCell>
                                    <TableCell>{voucher.value}</TableCell>
                                    <TableCell>{voucher.minSpend}</TableCell>
                                    <TableCell>
                                        <Badge variant={voucher.status === 'Active' ? 'default' : 'outline'}>{voucher.status}</Badge>
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
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive"
                                                    onSelect={() => handleDelete(voucher.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
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
