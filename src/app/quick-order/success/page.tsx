
"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ShoppingBag, ArrowRight, Star, Upload, X, Loader2, MessageSquare } from "lucide-react";
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getFirestore, collection, query, where, getDocs, limit, doc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, Review } from '@/types';
import StarRatingInput from '@/components/StarRatingInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { PutBlobResult } from '@vercel/blob';

const db = getFirestore(app);

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const orderNumber = searchParams.get('num');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // Review States
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const format = (val: number) => Number(val.toFixed(3));

    useEffect(() => {
        if (!orderNumber) {
            router.replace('/');
            return;
        }

        const fetchOrder = async () => {
            const q = query(collection(db, 'orders'), where('orderNumber', '==', orderNumber), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() } as Order);
            }
            setLoading(false);
        };
        fetchOrder();
    }, [orderNumber, router]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: `${label} কপি করা হয়েছে!` });
        }).catch(() => {
            toast({ title: "কপি করা সম্ভব হয়নি", variant: "destructive" });
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files].slice(0, 5));
        }
    };
    
    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            toast({ title: "অনুগ্রহ করে রেটিং দিন", variant: "destructive" });
            return;
        }
        if (!order || order.items.length === 0) return;
        
        setIsSubmittingReview(true);
        const product = order.items[0]; // Quick order usually has one product
        let uploadedImageUrls: string[] = [];

        try {
            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const response = await fetch(`/api/upload?filename=${file.name}`, {
                        method: 'POST',
                        body: file,
                    });
                    if (!response.ok) throw new Error('Image upload failed');
                    const newBlob = (await response.json()) as PutBlobResult;
                    uploadedImageUrls.push(newBlob.url);
                }
            }

            const reviewsRef = collection(db, 'products', product.id.toString(), 'reviews');
            const reviewDocRef = doc(reviewsRef);
            
            const newReviewData: Review = {
                id: reviewDocRef.id,
                productId: product.id,
                productName: product.name,
                orderId: order.id,
                user: {
                    uid: order.userId,
                    displayName: order.shippingAddress.fullName || 'Guest User',
                },
                rating,
                comment,
                images: uploadedImageUrls,
                date: new Date().toISOString(),
                status: 'approved',
            };
            
            await setDoc(reviewDocRef, newReviewData);
            setReviewSubmitted(true);
            toast({ title: "ধন্যবাদ!", description: "আপনার মূল্যবান রিভিউটি গ্রহণ করা হয়েছে।" });
        } catch (error) {
            console.error("Review failed:", error);
            toast({ title: "দুঃখিত", description: "রিভিউ দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।", variant: "destructive" });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading || !orderNumber) return <LoadingSpinner />;

    return (
        <div className="container mx-auto max-md px-4 py-12 text-center">
            <div className="mb-8 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto drop-shadow-lg" />
            </div>
            
            <h1 className="text-3xl font-black text-primary mb-2 uppercase tracking-tighter">অর্ডার কনফার্ম!</h1>
            <p className="text-muted-foreground mb-8">আমাদের ওপর আস্থা রাখার জন্য ধন্যবাদ। শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>

            <Card className="border-2 border-primary/10 shadow-xl overflow-hidden mb-6">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">আপনার অর্ডার আইডি</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-2 border-dashed">
                        <span className="flex-1 font-mono text-xl font-black tracking-widest text-primary">#{orderNumber}</span>
                        <Button 
                            variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10"
                            onClick={() => handleCopy(orderNumber!, "অর্ডার আইডি")}
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* REVIEW SECTION */}
            {!reviewSubmitted && order && order.items.length > 0 && (
                <Card className="border-2 border-orange-200 shadow-xl overflow-hidden mb-6 bg-gradient-to-b from-orange-50/50 to-white animate-in slide-in-from-bottom-4 duration-700">
                    <CardHeader className="bg-orange-100/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
                            <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
                            আপনার মতামত দিন
                        </CardTitle>
                        <CardDescription className="text-xs">পণ্যটি আপনার কেমন লেগেছে? আপনার একটি রিভিউ অন্যদের সাহায্য করবে।</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex flex-col items-center gap-2">
                             <div className="w-16 h-16 rounded-md border overflow-hidden bg-white mb-2">
                                <img src={order.items[0].image} alt={order.items[0].name} className="w-full h-full object-cover" />
                             </div>
                             <p className="text-xs font-bold truncate max-w-[200px]">{order.items[0].name}</p>
                            <StarRatingInput rating={rating} onRatingChange={setRating} className="mb-2" />
                        </div>

                        <div className="space-y-2 text-left">
                            <Label htmlFor="guest-comment" className="text-xs font-bold text-muted-foreground uppercase">মতামত লিখুন</Label>
                            <Textarea 
                                id="guest-comment"
                                placeholder="পণ্যটি কেমন ছিল? ডেলিভারি সার্ভিস কেমন ছিল? এখানে লিখুন..."
                                className="resize-none h-24"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 text-left">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">ছবি যুক্ত করুন (ঐচ্ছিক)</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {imageFiles.map((file, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border bg-white group">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(index)}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {imageFiles.length < 5 && (
                                    <label htmlFor="guest-upload" className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer hover:bg-orange-50 transition-colors">
                                        <Upload className="h-5 w-5 text-orange-400" />
                                        <span className="text-[8px] font-bold text-orange-500 mt-1">Upload</span>
                                        <input 
                                            id="guest-upload" 
                                            type="file" 
                                            multiple 
                                            className="hidden" 
                                            onChange={handleFileChange} 
                                            accept="image/*"
                                            ref={inputFileRef}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-orange-50/30">
                        <Button 
                            className="w-full bg-orange-500 hover:bg-orange-600 font-bold"
                            onClick={handleSubmitReview}
                            disabled={isSubmittingReview || rating === 0}
                        >
                            {isSubmittingReview ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> সাবমিট হচ্ছে...</>
                            ) : "রিভিউ সাবমিট করুন"}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {reviewSubmitted && (
                <Card className="mb-6 bg-green-50 border-green-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <p className="text-sm font-bold text-green-700">আপনার রিভিউটি সফলভাবে জমা দেওয়া হয়েছে। ধন্যবাদ!</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                <Button asChild variant="outline" size="lg" className="w-full h-14 text-lg font-bold">
                    <Link href="/">
                        <ShoppingBag className="mr-2 h-5 w-5" /> আরও কেনাকাটা করুন
                    </Link>
                </Button>
            </div>

            <p className="mt-8 text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">PabnaMart E-commerce</p>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <Suspense fallback={<LoadingSpinner />}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
