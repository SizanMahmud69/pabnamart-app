
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
import { collection, deleteDoc, doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Offer } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const db = getFirestore(app);

export default function AdminOfferManagement() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'offers'), (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(offersData);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!offerToDelete || !offerToDelete.id) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'offers', offerToDelete.id));
        toast({ title: "Offer Deleted", description: "The offer has been successfully deleted." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete offer.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setOfferToDelete(null);
    }
  }

  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set end date to the end of the day

    if (now < start) {
      return { text: 'Upcoming', variant: 'secondary' as const };
    } else if (now > end) {
      return { text: 'Expired', variant: 'outline' as const };
    } else {
      return { text: 'Active', variant: 'default' as const };
    }
  };

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
                      <CardDescription>Create and manage special offers for product categories.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Category Name</TableHead>
                                  <TableHead>Discount</TableHead>
                                  <TableHead>Active Period</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {offers.map(offer => {
                                const status = getStatus(offer.startDate, offer.endDate);
                                return (
                                  <TableRow key={offer.id}>
                                      <TableCell className="font-medium">{offer.name}</TableCell>
                                      <TableCell>{offer.discount}%</TableCell>
                                      <TableCell>{new Date(offer.startDate).toLocaleDateString()} to {new Date(offer.endDate).toLocaleDateString()}</TableCell>
                                      <TableCell>
                                          <Badge variant={status.variant}>{status.text}</Badge>
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
                                                  <DropdownMenuItem onSelect={() => router.push(`/admin/offers/edit/${offer.id}`)}>
                                                      <Edit className="mr-2 h-4 w-4" />
                                                      <span>Edit</span>
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem
                                                      className="text-destructive"
                                                      onSelect={() => setOfferToDelete(offer)}
                                                  >
                                                      <Trash2 className="mr-2 h-4 w-4" />
                                                      <span>Delete</span>
                                                  </DropdownMenuItem>
                                              </DropdownMenuContent>
                                          </DropdownMenu>
                                      </TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </main>
      </div>
      <AlertDialog open={!!offerToDelete} onOpenChange={(open) => !open && setOfferToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the offer for <span className="font-bold">{offerToDelete?.name}</span>.
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
