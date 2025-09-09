
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc, collection, runTransaction, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, Review, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

const db = getFirestore(app);

interface ReviewData {
  rating: number;
  comment: string;
}

const StarRatingInput = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer transition-colors ${rating >= star ? 'text-accent fill-accent' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                />
            ))}
        </div>
    )
}

export default function WriteReviewPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Record<string, ReviewData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { toast } = useToast();
    const params = useParams();
    const orderId = params.orderId as string;
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!orderId || !user) return;

        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    const orderData = { id: orderDocSnap.id, ...orderDocSnap.data() } as Order;
                    if (orderData.userId !== user.uid) {
                        toast({ title: "Access Denied", variant: "destructive" });
                        router.push('/account/orders');
                        return;
                    }
                    if (orderData.isReviewed) {
                        toast({ title: "Already Reviewed", description: "You have already submitted a review for this order.", variant: "destructive" });
                        router.push('/account/orders');
                        return;
                    }
                    setOrder(orderData);
                    // Initialize reviews state
                    const initialReviews: Record<string, ReviewData> = {};
                    orderData.items.forEach(item => {
                        initialReviews[item.id] = { rating: 0, comment: '' };
                    });
                    setReviews(initialReviews);
                } else {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/account/orders');
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, toast, router, user]);
    
    const handleReviewChange = (productId: number, field: 'rating' | 'comment', value: string | number) => {
        setReviews(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };
    
    const handleSubmitReviews = async () => {
        if (!user || !order) return;
    
        const reviewsToSubmit = Object.entries(reviews)
            .filter(([_, data]) => data.rating > 0 && data.comment.trim() !== '');
    
        if (reviewsToSubmit.length === 0) {
            toast({ title: "No reviews to submit", description: "Please provide a rating and a comment for at least one product.", variant: "destructive" });
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            for (const [productIdStr, reviewData] of reviewsToSubmit) {
                const productId = parseInt(productIdStr, 10);
                const productItem = order.items.find(item => item.id === productId);
    
                if (!productItem) continue;
    
                const productDocRef = doc(db, 'products', productId.toString());
    
                await runTransaction(db, async (transaction) => {
                    const productDoc = await transaction.get(productDocRef);
                    if (!productDoc.exists()) {
                        throw new Error(`Product ${productId} not found`);
                    }
    
                    const productData = productDoc.data() as Product;
                    const existingReviews = productData.reviews || [];
    
                    if (existingReviews.some(r => r.orderId === orderId && r.user.uid === user.uid)) {
                        return;
                    }
    
                    const reviewId = doc(collection(db, `products/${productId}/reviews`)).id;
                    const newReview: Review = {
                        id: reviewId,
                        orderId: order.id,
                        productId: productItem.id,
                        productName: productItem.name,
                        user: {
                            uid: user.uid,
                            displayName: user.displayName || 'Anonymous'
                        },
                        rating: reviewData.rating,
                        comment: reviewData.comment,
                        date: new Date().toISOString(),
                        status: 'approved' // Automatically approve reviews
                    };
                    
                    const reviewDocRef = doc(db, `products/${productId}/reviews`, reviewId);
                    transaction.set(reviewDocRef, newReview);

                    const updatedReviews = [...existingReviews, newReview];
                    
                    // Recalculate average rating
                    const approvedReviews = updatedReviews.filter(r => r.status === 'approved');
                    const newRating = approvedReviews.length > 0
                        ? approvedReviews.reduce((acc, curr) => acc + curr.rating, 0) / approvedReviews.length
                        : 0;

                    transaction.update(productDocRef, { 
                        reviews: updatedReviews,
                        rating: newRating
                    });
                });
            }

            // Mark the order as reviewed
            const orderDocRef = doc(db, 'orders', orderId);
            await updateDoc(orderDocRef, { isReviewed: true });
    
            toast({
                title: "Reviews Submitted",
                description: "Thank you for your feedback!",
            });
            router.push('/account/reviews');
        } catch (error) {
            console.error("Error submitting reviews:", error);
            toast({ title: "Error", description: "Failed to submit your reviews.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!order) return null;

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto p-4 max-w-2xl">
                <header className="py-4">
                    <Button asChild variant="outline">
                        <Link href="/account/orders?status=delivered">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Delivered Orders
                        </Link>
                    </Button>
                </header>
                <main>
                    <Card>
                        <CardHeader>
                            <CardTitle>Write a Review</CardTitle>
                            <CardDescription>For order #{order.orderNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {order.items.map(item => (
                                <div key={item.id} className="space-y-4 p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-md border">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Your Rating</Label>
                                        <StarRatingInput
                                            rating={reviews[item.id]?.rating || 0}
                                            setRating={(rating) => handleReviewChange(item.id, 'rating', rating)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`comment-${item.id}`}>Your Review</Label>
                                        <Textarea
                                            id={`comment-${item.id}`}
                                            placeholder="Share your thoughts about this product..."
                                            value={reviews[item.id]?.comment || ''}
                                            onChange={(e) => handleReviewChange(item.id, 'comment', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleSubmitReviews} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Reviews
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        </div>
    );
}
