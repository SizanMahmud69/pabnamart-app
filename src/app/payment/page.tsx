
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import type { OrderPayload } from "@/app/checkout/page";
import { withAuth } from "@/hooks/useAuth";
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Product, Voucher, ShippingAddress } from '@/types';
import LoadingSpinner from "@/components/LoadingSpinner";

const db = getFirestore(app);

// Server-side calculation function (simulated on client for display, but real calculation is on server)
async function calculateServerTotal(payload: OrderPayload): Promise<number> {
    const productRefs = payload.items.map(item => doc(db, 'products', item.id.toString()));
    const productDocs = await Promise.all(productRefs.map(ref => getDoc(ref)));
    
    let subtotal = 0;
    for (let i = 0; i < productDocs.length; i++) {
        const productDoc = productDocs[i];
        const item = payload.items[i];
        if (productDoc.exists()) {
            const productData = productDoc.data() as Product;
            subtotal += productData.price * item.quantity;
        }
    }

    let voucherDiscount = 0;
    if (payload.voucherCode) {
        const voucherDoc = await getDoc(doc(db, 'vouchers', payload.voucherCode));
        if (voucherDoc.exists()) {
            const voucherData = voucherDoc.data() as Voucher;
            if (!voucherData.minSpend || subtotal >= voucherData.minSpend) {
                if (voucherData.type === 'fixed') {
                    voucherDiscount = voucherData.discount;
                } else {
                    voucherDiscount = (subtotal * voucherData.discount) / 100;
                }
            }
        }
    }
    
    const subtotalAfterDiscount = subtotal - voucherDiscount;

    // Shipping fee calculation (simplified for display)
    const deliverySettingsDoc = await getDoc(doc(db, 'settings', 'delivery'));
    let shippingFee = 0;
    if (deliverySettingsDoc.exists()) {
        const settings = deliverySettingsDoc.data() as any;
        // This is a simplified estimation. The server will do the real check.
        shippingFee = settings.outsidePabnaSmall || 120; // Default estimate
    }

    return Math.round(subtotalAfterDiscount + shippingFee);
}


function PaymentPage() {
    const [orderPayload, setOrderPayload] = useState<OrderPayload | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const storedPayload = sessionStorage.getItem('orderPayload');

        if (storedPayload) {
            const payload = JSON.parse(storedPayload);
            setOrderPayload(payload);
            calculateServerTotal(payload).then(amount => {
                setTotalAmount(amount);
                setIsLoading(false);
            });
        } else {
            router.push('/checkout');
        }
    }, [router, searchParams]);

    const handleConfirmPayment = () => {
        setIsLoading(true);
        router.push('/payment/gateway');
    };
    
    if (isLoading || !orderPayload) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
            <div className="container mx-auto max-w-md px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Confirm Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Amount to Pay</span>
                            <span>৳{totalAmount}</span>
                        </div>
                        <Separator />
                        <div className="text-center">
                            <p className="text-muted-foreground">You will be redirected to the payment gateway to complete your purchase.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleConfirmPayment} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Proceed to Pay
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(PaymentPage);

    