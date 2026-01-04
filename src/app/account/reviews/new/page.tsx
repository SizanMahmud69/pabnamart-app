
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRatingInput from "@/components/StarRatingInput";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, collection, addDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useAuth, withAuth } from "@/hooks/useAuth";
import type { User as FirebaseUser } from 'firebase/auth';
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Review } from "@/types";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import type { PutBlobResult } from '@vercel/blob';

const db = getFirestore(app);

function NewReviewPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();

    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!productId || !productName) {
            toast({ title: "Error", description: "Product information is missing.", variant: "destructive" });
            router.push("/account/orders");
        }
    }, [productId, productName, router, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files].slice(0, 5)); // Limit to 5 images
        }
    };
    
    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Please select a rating", variant: "destructive" });
            return;
        }
        if (!user || !productId) return;
        
        setIsSubmitting(true);
        let uploadedImageUrls: string[] = [];
        try {
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const response = await fetch(`/api/upload?filename=${file.name}`, {
                        method: 'POST',
                        body: file,
                    });
                    if (!response.ok) throw new Error('Failed to upload image.');
                    const newBlob = (await response.json()) as PutBlobResult;
                    uploadedImageUrls.push(newBlob.url);
                }
            }

            const reviewsRef = collection(db, `products/${productId}/reviews`);
            const newReviewData: Omit<Review, 'id'> = {
                productId: Number(productId),
                productName: productName || 'Unknown Product',
                user: {
                    uid: user.uid,
                    displayName: user.displayName || 'Anonymous',
                },
                rating,
                comment,
                images: uploadedImageUrls,
                date: new Date().toISOString(),
                status: 'pending',
            };
            
            const reviewDocRef = doc(reviewsRef);
            await addDoc(reviewsRef, { ...newReviewData, id: reviewDocRef.id });

            toast({
                title: "Review Submitted",
                description: "Thank you! Your review is pending approval.",
            });
            router.push('/account/orders');
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

    if (!productId || !productName) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-lg px-4 py-6">
                <Button asChild variant="ghost" className="mb-4" onClick={() => router.back()}>
                    <span>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </span>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Write a Review</CardTitle>
                        <CardDescription>Share your thoughts on {decodeURIComponent(productName)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 text-center">
                            <Label>Your Rating</Label>
                            <div className="flex justify-center">
                                <StarRatingInput rating={rating} onRatingChange={setRating} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comment">Your Review</Label>
                            <Textarea
                                id="comment"
                                placeholder="Tell us what you liked or disliked..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Add Photos (optional)</Label>
                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {imageFiles.map((file, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <Image src={URL.createObjectURL(file)} alt={file.name} fill sizes="128px" className="object-cover rounded-md" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeImage(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {imageFiles.length < 5 && (
                                    <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground text-center">Upload</p>
                                        </div>
                                        <Input id="image-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" ref={inputFileRef} />
                                    </Label>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">You can upload up to 5 images.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                         <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

function NewReviewPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <NewReviewPageContent />
        </Suspense>
    )
}

export default withAuth(NewReviewPage);

    