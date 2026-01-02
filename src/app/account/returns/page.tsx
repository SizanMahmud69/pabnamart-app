
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, ClipboardCheck, Package, Send } from "lucide-react";
import { withAuth } from "@/hooks/useAuth";
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, DeliverySettings } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

function ReturnRequestPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!orderId) {
            toast({ title: "Error", description: "No order specified.", variant: "destructive" });
            router.push('/account/orders');
            return;
        }

        const orderRef = doc(db, 'orders', orderId);
        const orderUnsub = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                setOrder({ ...docSnap.data(), id: docSnap.id } as Order);
            } else {
                 toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                 router.push('/account/orders');
            }
            setLoading(false);
        });
        
        const settingsRef = doc(db, 'settings', 'delivery');
        const settingsUnsub = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setDeliverySettings(docSnap.data() as DeliverySettings);
            }
        });

        return () => {
            orderUnsub();
            settingsUnsub();
        };

    }, [orderId, router, toast]);
    
    const handleConfirmReturn = async () => {
        if (!order || order.status !== 'delivered') {
            toast({ title: "Cannot Request Return", description: "This order is not eligible for a return request.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: 'return-requested' });
            toast({
                title: "Return Request Submitted",
                description: "Your return request has been submitted for processing.",
            });
            router.push(`/account/orders?status=return-requested`);
        } catch (error) {
             toast({ title: "Error", description: "Failed to submit return request.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (loading || !order || !deliverySettings) {
        return <LoadingSpinner />;
    }
    
    if (order.status !== 'delivered') {
        return (
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto max-w-2xl px-4 py-6">
                     <Button asChild variant="ghost" className="mb-4">
                        <Link href="/account/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                    </Button>
                    <Card>
                        <CardHeader>
                            <CardTitle>Return Not Allowed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This order is not eligible for return. A return may have already been requested or the order was not delivered.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Return</CardTitle>
                        <CardDescription>
                            Please follow the steps below to return products from order #{order.orderNumber}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose max-w-none text-muted-foreground">
                            <h3 className="text-foreground font-semibold">Return Policy</h3>
                            <ul>
                                <li>Products can be returned within 7 days of delivery.</li>
                                <li>The product must be in its original condition, unused, and with all original tags and packaging intact.</li>
                                <li>An admin will review your request. If approved, you will receive a voucher for the order amount.</li>
                            </ul>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-foreground font-semibold">Return Process</h3>
                             <div className="flex items-start gap-4 p-4 rounded-lg border">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">1. Pack Your Item</h4>
                                    <p className="text-sm text-muted-foreground">Securely pack the item you wish to return in its original packaging if possible.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-lg border">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                    <Send className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">2. Send to Our Address</h4>
                                    <p className="text-sm text-muted-foreground">Please send the package via a reliable courier service to the following address:</p>
                                    <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono">
                                        {deliverySettings.returnAddress || "Please contact support for the return address."}
                                    </div>
                                </div>
                            </div>
                             <div className="flex items-start gap-4 p-4 rounded-lg border">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                    <ClipboardCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">3. Confirm Your Return Request</h4>
                                    <p className="text-sm text-muted-foreground">After sending the package, click the button below to notify us. Our team will review your request.</p>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                         <Button className="w-full" onClick={handleConfirmReturn} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             <Check className="mr-2 h-4 w-4" />
                            Confirm Return Request
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}


export default function ReturnRequestPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <withAuth>
                <ReturnRequestPageContent />
            </withAuth>
        </Suspense>
    )
}
