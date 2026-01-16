
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { placeOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, ShippingAddress } from "@/types";
import { Loader2, ArrowLeft, CreditCard, Truck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDeliveryCharge } from "@/hooks/useDeliveryCharge";
import { Alert, AlertDescription } from "@/components/ui/alert";


interface CheckoutData {
    items: CartItem[];
    shippingAddress: ShippingAddress;
    shippingFee: number;
    total: number;
    subtotal: number;
    voucherCode?: string;
}

function PaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();
    
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isPlacingOrder, startOrderPlacement] = useTransition();
    const { cashOnDeliveryFee } = useDeliveryCharge();

    useEffect(() => {
        const data = sessionStorage.getItem('checkoutData');
        if (data) {
            setCheckoutData(JSON.parse(data));
        } else {
            router.replace('/cart');
        }
    }, [router]);

    const handlePlaceOrder = () => {
        if (!checkoutData || !user || paymentMethod !== 'cash-on-delivery') return;

        startOrderPlacement(async () => {
            const result = await placeOrder({
                userId: user.uid,
                items: checkoutData.items,
                shippingAddress: checkoutData.shippingAddress,
                shippingFee: checkoutData.shippingFee,
                voucherCode: checkoutData.voucherCode,
                paymentMethod: 'cash-on-delivery',
                transactionId: '',
                cashOnDeliveryFee: cashOnDeliveryFee,
            });

            if (result.success && result.orderId) {
                toast({ title: "Order Placed!", description: "Your order has been placed successfully." });
                sessionStorage.removeItem('checkoutData');
                await clearCart();
                router.replace(`/account/orders/${result.orderId}`);
            } else {
                toast({ title: "Order Failed", description: result.message || "An unexpected error occurred.", variant: "destructive" });
            }
        });
    };
    
    const handleOnlinePayment = () => {
        router.push('/payment/online');
    }

    if (!checkoutData) {
        return <LoadingSpinner />;
    }

    const codTotal = checkoutData.total + (paymentMethod === 'cash-on-delivery' ? cashOnDeliveryFee : 0);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-lg px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/checkout">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Checkout
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Select Payment Method</CardTitle>
                        <CardDescription>Your order total is ৳{checkoutData.total}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card 
                            className={cn(
                                "cursor-pointer transition-all",
                                paymentMethod === 'cash-on-delivery' ? "border-primary ring-2 ring-primary" : "hover:border-gray-400"
                            )}
                            onClick={() => setPaymentMethod('cash-on-delivery')}
                        >
                            <CardContent className="p-6 flex items-center gap-4">
                                <Truck className="h-8 w-8 text-primary" />
                                <div>
                                    <h3 className="font-bold text-lg">Cash on Delivery</h3>
                                    <p className="text-sm text-muted-foreground">Pay with cash when your order is delivered.</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {paymentMethod === 'cash-on-delivery' && cashOnDeliveryFee > 0 && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <span>Cash on Delivery Fee</span>
                                    <span className="font-semibold">৳{cashOnDeliveryFee}</span>
                                </AlertDescription>
                            </Alert>
                        )}

                         <Card 
                            className={cn(
                                "cursor-pointer transition-all",
                                paymentMethod === 'online' ? "border-primary ring-2 ring-primary" : "hover:border-gray-400"
                            )}
                             onClick={() => setPaymentMethod('online')}
                        >
                            <CardContent className="p-6 flex items-center gap-4">
                                <CreditCard className="h-8 w-8 text-primary" />
                                <div>
                                    <h3 className="font-bold text-lg">Online Payment</h3>
                                    <p className="text-sm text-muted-foreground">Pay with bKash, Nagad, or Rocket.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter>
                       {paymentMethod === 'cash-on-delivery' && (
                            <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                                {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPlacingOrder ? 'Placing Order...' : `Place Order (৳${codTotal})`}
                            </Button>
                        )}
                        {paymentMethod === 'online' && (
                             <Button size="lg" className="w-full" onClick={handleOnlinePayment}>
                                Continue to Online Payment
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(PaymentPage);
