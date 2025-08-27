
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

const mockOffers = [
  { id: '1', name: 'Mega Electronics Sale', discount: '40%', status: 'Active', period: '2023-10-20 to 2023-10-31' },
  { id: '2', name: 'Winter Fashion Fest', discount: '25%', status: 'Active', period: '2023-11-01 to 2023-11-15' },
  { id: '3', name: 'Summer Clearance', discount: '50%', status: 'Expired', period: '2023-08-01 to 2023-08-15' },
];

export default function AdminOfferManagement() {
  const [offers, setOffers] = useState(mockOffers);

  return (
    <div className="container mx-auto p-4">
        <header className="py-4 flex justify-between items-center">
            <Button asChild variant="outline" size="sm">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Offer
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
                                <TableHead>Actions</TableHead>
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
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
