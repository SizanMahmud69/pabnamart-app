
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2, ClipboardCheck, Package, Send, Hourglass, CheckCircle, XCircle } from "lucide-react";
import { withAuth } from "@/hooks/useAuth";
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, DeliverySettings } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createAndSendNotification } from '@/app/actions';

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
    
    const handleReturnRequest = async () => {
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
        } catch (error) {
             toast({ title: "Error", description: "Failed to submit return request.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleConfirmShipment = async () => {
        if (!order || order.status !== 'return-approved') return;
        setIsSubmitting(true);
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, { status: 'return-shipped' });
            await createAndSendNotification(order.userId, {
                icon: 'Truck',
                title: 'Return Item Shipped',
                description: `You've confirmed shipment for order #${order.orderNumber}. We will notify you once it's finalized.`,
                href: `/account/orders/${order.id}`
            });
            toast({
                title: "Shipment Confirmed",
                description: "Admin has been notified. Please wait for the finalization.",
            });
        } catch (error) {
             toast({ title: "Error", description: "Failed to confirm shipment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (loading || !order) {
        return <LoadingSpinner />;
    }
    
    const renderContentByStatus = () => {
        switch (order.status) {
            case 'delivered':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Request a Return</CardTitle>
                            <CardDescription>Follow the steps below for order #{order.orderNumber}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="prose max-w-none text-muted-foreground">
                                <h3 className="text-foreground font-semibold">Return Policy</h3>
                                <ul>
                                    <li>Products can be returned within 7 days of delivery.</li>
                                    <li>The product must be in its original condition, unused, and with all original tags and packaging intact.</li>
                                    <li>An admin will review your request. If approved, you will be instructed on how to return the item.</li>
                                </ul>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-lg border">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                    <ClipboardCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Confirm Your Return Request</h4>
                                    <p className="text-sm text-muted-foreground">Click the button below to notify us. Our team will review your request and approve it if it meets the policy.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full" onClick={handleReturnRequest} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 <Check className="mr-2 h-4 w-4" />
                                Confirm Return Request
                            </Button>
                        </CardFooter>
                    </Card>
                );

            case 'return-requested':
                return (
                     <Card>
                        <CardHeader className="text-center">
                            <Hourglass className="mx-auto h-12 w-12 text-yellow-500" />
                            <CardTitle className="mt-4">Return Request Pending</CardTitle>
                            <CardDescription>Your request for order #{order.orderNumber} is being reviewed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-muted-foreground">We will notify you once your request has been approved or declined. This usually takes 1-2 business days.</p>
                        </CardContent>
                    </Card>
                );
            
            case 'return-approved':
                return (
                     <Card>
                        <CardHeader>
                             <div className="flex justify-center mb-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-center">Return Request Approved</CardTitle>
                            <CardDescription className="text-center">Please send the product back to us.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                        {deliverySettings?.returnAddress || "Please contact support for the return address."}
                                    </div>
                                </div>
                            </div>
                             <div className="flex items-start gap-4 p-4 rounded-lg border">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                    <ClipboardCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">3. Confirm Shipment</h4>
                                    <p className="text-sm text-muted-foreground">After sending the package, click the button below to notify us that the item is on its way.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleConfirmShipment} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                I Have Shipped the Item
                            </Button>
                        </CardFooter>
                    </Card>
                );

            case 'return-shipped':
                return (
                    <Card>
                        <CardHeader className="text-center">
                            <Hourglass className="mx-auto h-12 w-12 text-blue-500" />
                            <CardTitle className="mt-4">Item Shipped</CardTitle>
                            <CardDescription>We are awaiting your returned item for order #{order.orderNumber}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-muted-foreground">Once we receive and inspect the item, we will finalize the return. You will be notified of the outcome.</p>
                        </CardContent>
                    </Card>
                );
            
            case 'returned':
                 return (
                    <Card>
                        <CardHeader className="text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <CardTitle className="mt-4">Return Complete</CardTitle>
                            <CardDescription>Your return for order #{order.orderNumber} is finalized.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground">A voucher for the returned amount has been added to your account.</p>
                            <Button asChild className="mt-4">
                                <Link href="/account/vouchers">View My Vouchers</Link>
                            </Button>
                        </CardContent>
                    </Card>
                );

            case 'return-denied':
                return (
                    <Card>
                        <CardHeader className="text-center">
                            <XCircle className="mx-auto h-12 w-12 text-destructive" />
                            <CardTitle className="mt-4">Return Denied</CardTitle>
                            <CardDescription>Your return request for order #{order.orderNumber} was not approved.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-muted-foreground">This may be because the request did not meet our return policy. Please contact customer support for more information.</p>
                        </CardContent>
                    </Card>
                );
            
            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Return Not Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>This order is not currently eligible for return. Status: {order.status}</p>
                        </CardContent>
                    </Card>
                );
        }
    };


    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Link>
                </Button>
                {renderContentByStatus()}
            </div>
        </div>
    );
}


function ReturnRequestPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ReturnRequestPageContent />
        </Suspense>
    )
}

export default withAuth(ReturnRequestPage);
