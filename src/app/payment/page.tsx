
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
import { Loader2, ArrowLeft, CreditCard, Truck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

    const { total } = checkoutData;

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
                        <CardDescription>Your final order total is ৳{total}.</CardDescription>
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
                                {isPlacingOrder ? 'Placing Order...' : `Place Order (৳${total})`}
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
