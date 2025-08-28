
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { collection, deleteDoc, doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Voucher } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);

export default function AdminVoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
        const vouchersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
        setVouchers(vouchersData);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this voucher?')) {
        try {
            await deleteDoc(doc(db, 'vouchers', id));
            toast({ title: "Voucher Deleted", description: "The voucher has been successfully deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete voucher.", variant: "destructive" });
        }
    }
  }
  
  if (loading) {
      return <LoadingSpinner />;
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
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Min. Spend</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vouchers.map(voucher => (
                                <TableRow key={voucher.id}>
                                    <TableCell className="font-mono">{voucher.code}</TableCell>
                                    <TableCell>{voucher.description}</TableCell>
                                    <TableCell className="capitalize">{voucher.type}</TableCell>
                                    <TableCell>{voucher.type === 'fixed' ? `৳${voucher.discount}` : `${voucher.discount}%`}</TableCell>
                                    <TableCell>{voucher.minSpend ? `৳${voucher.minSpend}` : 'N/A'}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => router.push(`/admin/vouchers/edit/${voucher.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive"
                                                    onSelect={() => handleDelete(voucher.id!)}
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
