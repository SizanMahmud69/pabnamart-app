
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import type { OrderPayload } from "@/app/checkout/page";
import { withAuth } from "@/hooks/useAuth";

function PaymentPage() {
    const [orderPayload, setOrderPayload] = useState<OrderPayload | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedPayload = sessionStorage.getItem('orderPayload');
        const finalTotal = sessionStorage.getItem('finalTotalForPayment');

        if (storedPayload && finalTotal) {
            setOrderPayload(JSON.parse(storedPayload));
            setTotalAmount(Number(finalTotal));
        } else {
            router.push('/checkout');
        }
        setIsLoading(false);
    }, [router]);

    const handleConfirmPayment = () => {
        setIsLoading(true);
        router.push('/payment/gateway');
    };
    
    if (isLoading || !orderPayload) {
        return null;
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
                        <div>
                            <h4 className="font-semibold mb-2">Shipping to your default address</h4>
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
