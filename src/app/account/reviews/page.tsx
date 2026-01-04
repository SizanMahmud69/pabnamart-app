
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import StarRating from "@/components/StarRating";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import type { Review } from "@/types";
import { getFirestore, collectionGroup, query, where, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";

const db = getFirestore(app);

export default function ReviewsPage() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const reviewsRef = collectionGroup(db, 'reviews');
        
        const q = query(reviewsRef, where('user.uid', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userReviews = snapshot.docs.map(doc => doc.data() as Review);
            setReviews(userReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Reviews</h1>
                <Card>
                    <CardContent className="p-6">
                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review.id}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">{review.productName}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StarRating rating={review.rating} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                 <p className="text-sm text-muted-foreground mb-1">{new Date(review.date).toLocaleDateString()}</p>
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
                                        <Separator className="mt-6" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Star className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">No Reviews Yet</h2>
                                <p className="text-muted-foreground">You haven't reviewed any products.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    