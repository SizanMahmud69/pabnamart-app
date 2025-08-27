
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const mockOffers = [
  { id: '1', name: 'Mega Electronics Sale', discount: '40%', status: 'Active', period: '2023-10-20 to 2023-10-31' },
  { id: '2', name: 'Winter Fashion Fest', discount: '25%', status: 'Active', period: '2023-11-01 to 2023-11-15' },
  { id: '3', name: 'Summer Clearance', discount: '50%', status: 'Expired', period: '2023-08-01 to 2023-08-15' },
];

export default function AdminOfferManagement() {
  const [offers, setOffers] = useState(mockOffers);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
        setOffers(offers.filter(offer => offer.id !== id));
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
                <Link href="/admin/offers/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Offer
                </Link>
            </Button>
        </header>
        <main>
            <Card>
                <CardHeader>
                    <CardTitle>Offer Management</CardTitle>
                    <CardDescription>Create and manage special offers for your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Offer Name</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Active Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map(offer => (
                                <TableRow key={offer.id}>
                                    <TableCell className="font-medium">{offer.name}</TableCell>
                                    <TableCell>{offer.discount}</TableCell>
                                    <TableCell>{offer.period}</TableCell>
                                    <TableCell>
                                        <Badge variant={offer.status === 'Active' ? 'default' : 'outline'}>{offer.status}</Badge>
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
                                                    onClick={() => handleDelete(offer.id)}
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
