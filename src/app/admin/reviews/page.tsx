
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collectionGroup, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Review } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StarRating from '@/components/StarRating';

const db = getFirestore(app);

export default function AdminReviewManagement() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collectionGroup(db, 'reviews'), (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
            setReviews(reviewsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async () => {
        if (!reviewToDelete) return;
        setIsDeleting(true);
        const reviewRef = doc(db, `products/${reviewToDelete.productId}/reviews`, reviewToDelete.id);
        try {
            await deleteDoc(reviewRef);
            toast({ title: "Review Deleted", description: "The review has been permanently deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setReviewToDelete(null);
        }
    };

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
                            <CardDescription>View and delete customer reviews.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <Card key={review.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold">{review.productName}</h4>
                                                    <p className="text-sm text-muted-foreground">by {review.user.displayName}</p>
                                                    <StarRating rating={review.rating} className="mt-1" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={review.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{review.status}</Badge>
                                                    <AlertDialog onOpenChange={(open) => !open && setReviewToDelete(null)}>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setReviewToDelete(review)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete this review.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground mt-2">{review.comment}</p>
                                            {review.images && review.images.length > 0 && (
                                                <div className="mt-4 flex gap-2 flex-wrap">
                                                    {review.images.map((img, index) => (
                                                        <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden">
                                                            <img src={img} alt={`Review image ${index + 1}`} className="object-cover w-full h-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                             ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No reviews found.</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}
