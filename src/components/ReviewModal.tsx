
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRatingInput from "@/components/StarRatingInput";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, collection, addDoc, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { Loader2 } from "lucide-react";
import type { Review } from "@/types";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    user: FirebaseUser;
}

const db = getFirestore(app);

export default function ReviewModal({ isOpen, onClose, productId, productName, user }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Please select a rating", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const reviewsRef = collection(db, `products/${productId}/reviews`);
            const reviewId = doc(reviewsRef).id;
            
            const newReview: Review = {
                id: reviewId,
                productId,
                productName,
                user: {
                    uid: user.uid,
                    displayName: user.displayName || 'Anonymous',
                },
                rating,
                comment,
                date: new Date().toISOString(),
                status: 'pending',
            };
            
            await addDoc(reviewsRef, newReview);

            toast({
                title: "Review Submitted",
                description: "Thank you! Your review is pending approval.",
            });
            onClose();
            setRating(0);
            setComment("");
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({
                title: "Error",
                description: "Failed to submit your review.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>Share your thoughts on {productName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Your Rating</Label>
                        <StarRatingInput rating={rating} onRatingChange={setRating} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comment">Your Review</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us what you liked or disliked..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
