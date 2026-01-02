
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Voucher } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const db = getFirestore(app);

export default function AdminVoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const q = query(collection(db, 'vouchers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const vouchersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
        setVouchers(vouchersData);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!voucherToDelete || !voucherToDelete.id) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'vouchers', voucherToDelete.id));
        toast({ title: "Voucher Deleted", description: "The voucher has been successfully deleted." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete voucher.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setVoucherToDelete(null);
    }
  }
  
  if (loading) {
      return <LoadingSpinner />;
  }

  return (
    <>
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
                                    <TableHead>Usage Limit</TableHead>
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
                                        <TableCell>{voucher.usageLimit || 1}</TableCell>
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
                                                        onSelect={() => setVoucherToDelete(voucher)}
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

        <AlertDialog open={!!voucherToDelete} onOpenChange={(open) => !open && setVoucherToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the voucher <span className="font-bold">{voucherToDelete?.code}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeleting ? "Deleting..." : "Continue"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
