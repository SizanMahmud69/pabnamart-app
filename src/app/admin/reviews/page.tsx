
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collectionGroup, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Review, Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StarRating from '@/components/StarRating';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const db = getFirestore(app);

export default function AdminReviewManagement() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [reviewToHandle, setReviewToHandle] = useState<{ review: Review, action: 'delete' | 'approve' | 'reject' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        const unsubscribe = onSnapshot(collectionGroup(db, 'reviews'), (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => doc.data() as Review);
            setReviews(reviewsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateProductRating = async (productId: number, oldRating: number | null, newRating: number, reviewCountChange: number) => {
        const productRef = doc(db, 'products', String(productId));
        try {
            await runTransaction(db, async (transaction) => {
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw "Product not found!";
                }
                const productData = productDoc.data() as Product;
                const currentReviews = productData.reviews || [];
                const reviewCount = currentReviews.filter(r => r.status === 'approved').length;
                
                const totalRating = (productData.rating * reviewCount) - (oldRating || 0) + newRating;
                const newReviewCount = reviewCount + reviewCountChange;
                const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;

                transaction.update(productRef, { rating: newAverageRating });
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
            toast({ title: "Error", description: "Failed to update product rating.", variant: "destructive" });
        }
    };
    
    const handleApprove = async (review: Review) => {
        if (review.status === 'approved') return;
        setIsProcessing(true);
        const reviewRef = doc(db, `products/${review.productId}/reviews`, review.id);
        try {
            await updateDoc(reviewRef, { status: 'approved' });
            await updateProductRating(review.productId, null, review.rating, 1);
            toast({ title: "Review Approved", description: "The review is now public." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to approve review.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
            setReviewToHandle(null);
        }
    };

    const handleReject = async (review: Review) => {
        if (review.status === 'rejected') return;
        setIsProcessing(true);
        const reviewRef = doc(db, `products/${review.productId}/reviews`, review.id);
        try {
            const wasApproved = review.status === 'approved';
            await updateDoc(reviewRef, { status: 'rejected' });
            if (wasApproved) {
                await updateProductRating(review.productId, review.rating, 0, -1);
            }
            toast({ title: "Review Rejected", description: "The review has been rejected." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to reject review.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
            setReviewToHandle(null);
        }
    };

    const handleDelete = async (review: Review) => {
        setIsProcessing(true);
        const reviewRef = doc(db, `products/${review.productId}/reviews`, review.id);
        try {
            if (review.status === 'approved') {
                await updateProductRating(review.productId, review.rating, 0, -1);
            }
            await deleteDoc(reviewRef);
            toast({ title: "Review Deleted", description: "The review has been permanently deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
            setReviewToHandle(null);
        }
    };

    const filteredReviews = reviews.filter(r => r.status === activeTab);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <div className="container mx-auto p-4">
                <header className="py-4 flex justify-between items-center">
                    <Button asChild variant="outline" size="sm">
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
                             <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                </TabsList>
                                <TabsContent value={activeTab}>
                                     {filteredReviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredReviews.map(review => (
                                                <Card key={review.id} className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold">{review.productName}</h4>
                                                            <p className="text-sm text-muted-foreground">by {review.user.displayName}</p>
                                                            <StarRating rating={review.rating} className="mt-1" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                             {activeTab !== 'approved' && (
                                                                <Button size="icon" variant="outline" className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleApprove(review)}>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {activeTab !== 'rejected' && (
                                                                <Button size="icon" variant="outline" className="h-8 w-8 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600" onClick={() => handleReject(review)}>
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setReviewToHandle({ review, action: 'delete' })}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground mt-2">{review.comment}</p>
                                                </Card>
                                            ))}
                                        </div>
                                     ) : (
                                        <div className="text-center py-10">
                                            <p className="text-muted-foreground">No {activeTab} reviews found.</p>
                                        </div>
                                     )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </main>
            </div>

            <AlertDialog open={!!reviewToHandle} onOpenChange={(open) => !open && setReviewToHandle(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the review. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => reviewToHandle && handleDelete(reviewToHandle.review)} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
