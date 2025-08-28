
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collectionGroup, query, onSnapshot, getFirestore, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Review, Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/StarRating';

const db = getFirestore(app);

export default function AdminReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const reviewsRef = collectionGroup(db, 'reviews');
    const q = query(reviewsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviewData = snapshot.docs.map(doc => doc.data() as Review);
        setReviews(reviewData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching reviews:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (review: Review, status: 'approved' | 'rejected') => {
    const reviewDocRef = doc(db, 'products', review.productId.toString(), 'reviews', review.id);
    
    try {
        await runTransaction(db, async (transaction) => {
            const productDocRef = doc(db, 'products', review.productId.toString());
            const productDoc = await transaction.get(productDocRef);

            if (!productDoc.exists()) {
                throw new Error("Product not found!");
            }

            const productData = productDoc.data() as Product;
            const currentReviews = productData.reviews || [];

            const reviewIndex = currentReviews.findIndex(r => r.id === review.id);
            if (reviewIndex === -1) {
                throw new Error("Review not found in product!");
            }
            
            const wasApproved = currentReviews[reviewIndex].status === 'approved';

            // Update review status in product's subcollection and review array
            currentReviews[reviewIndex].status = status;
            transaction.update(reviewDocRef, { status });
            

            // Recalculate average rating
            const approvedReviews = currentReviews.filter(r => r.status === 'approved');
            const newRating = approvedReviews.length > 0
                ? approvedReviews.reduce((acc, curr) => acc + curr.rating, 0) / approvedReviews.length
                : 0;

            transaction.update(productDocRef, { 
                reviews: currentReviews,
                rating: newRating 
            });
        });
        toast({
            title: `Review ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: `The review for "${review.productName}" has been ${status}.`,
        });
    } catch (error) {
        console.error("Error updating review status:", error);
        toast({ title: "Error", description: "Failed to update review status.", variant: "destructive" });
    }
  };

  const handleDelete = async (review: Review) => {
    // Similar transaction logic as handleStatusChange but for deletion
    // Omitted for brevity, but would be implemented in a real app
    toast({ title: "Info", description: "Delete functionality to be implemented.", variant: "default" });
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
                    <CardTitle>Review Management</CardTitle>
                    <CardDescription>Approve, reject, or delete customer reviews.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reviews.length > 0 ? reviews.map(review => (
                                <TableRow key={review.id}>
                                    <TableCell className="font-medium">{review.productName}</TableCell>
                                    <TableCell>{review.user.displayName}</TableCell>
                                    <TableCell><StarRating rating={review.rating} /></TableCell>
                                    <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                                    <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={review.status === 'approved' ? 'default' : review.status === 'rejected' ? 'destructive' : 'secondary'}>
                                            {review.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {review.status === 'pending' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleStatusChange(review, 'approved')}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                        <span>Approve</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleStatusChange(review, 'rejected')}>
                                                        <XCircle className="mr-2 h-4 w-4 text-yellow-600" />
                                                        <span>Reject</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(review)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No reviews found.
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
