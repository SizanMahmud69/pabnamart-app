
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { placeOrder } from "@/lib/order-service";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, ShippingAddress } from "@/types";
import { Loader2, ArrowLeft, CreditCard, Truck, AlertCircle, Coins, Ticket, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn, formatMoney, roundMoney } from "@/lib/utils";
import { useDeliveryCharge } from "@/hooks/useDeliveryCharge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CheckoutData {
    items: CartItem[];
    shippingAddress: ShippingAddress;
    shippingFee: number;
    total: number;
    subtotal: number;
    voucherCode?: string;
    voucherDiscount?: number;
    coinDiscount?: number;
    spinDiscount?: number;
    spinDiscountPercentage?: number;
    referrerId?: string;
    useCoins?: boolean;
    useSpinDiscount?: boolean;
}

function PaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();
    
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isPlacingOrder, startOrderPlacement] = useTransition();
    const [isNavigating, startNavigation] = useTransition();
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
                referrerId: checkoutData.referrerId,
                useCoins: checkoutData.useCoins,
                useSpinDiscount: checkoutData.useSpinDiscount,
            });

            if (result.success && result.orderId) {
                toast({ title: "Order Placed!", description: "Your order has been placed successfully." });
                sessionStorage.removeItem('checkoutData');
                localStorage.removeItem('referrerId');
                await clearCart();
                router.replace(`/account/orders/${result.orderId}`);
            } else {
                toast({ title: "Order Failed", description: result.message || "An unexpected error occurred.", variant: "destructive" });
            }
        });
    };
    
    const handleOnlinePayment = () => {
        startNavigation(() => {
            router.push('/payment/online');
        });
    }

    if (!checkoutData) {
        return <LoadingSpinner />;
    }

    const codFee = paymentMethod === 'cash-on-delivery' ? roundMoney(cashOnDeliveryFee) : 0;
    const finalTotal = roundMoney(checkoutData.total + codFee);

    return (
        <div className="bg-purple-50/30 min-h-screen pb-20">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/checkout">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Checkout
                    </Link>
                </Button>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Payment Method</CardTitle>
                            <CardDescription>Choose how you want to pay for your order.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Card 
                                className={cn(
                                    "cursor-pointer transition-all border-2",
                                    paymentMethod === 'cash-on-delivery' ? "border-primary bg-primary/5" : "hover:border-gray-300"
                                )}
                                onClick={() => setPaymentMethod('cash-on-delivery')}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={cn("p-2 rounded-full", paymentMethod === 'cash-on-delivery' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                        <Truck className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold">Cash on Delivery</h3>
                                        <p className="text-xs text-muted-foreground">Pay with cash when your order is delivered.</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {paymentMethod === 'cash-on-delivery' && cashOnDeliveryFee > 0 && (
                                <Alert className="bg-orange-50 border-orange-200">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <AlertDescription className="text-xs text-orange-700 flex justify-between font-bold">
                                        <span>Cash on Delivery Surcharge</span>
                                        <span>+ ৳{formatMoney(cashOnDeliveryFee)}</span>
                                    </AlertDescription>
                                </Alert>
                            )}

                             <Card 
                                className={cn(
                                    "cursor-pointer transition-all border-2",
                                    paymentMethod === 'online' ? "border-primary bg-primary/5" : "hover:border-gray-300"
                                )}
                                 onClick={() => setPaymentMethod('online')}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={cn("p-2 rounded-full", paymentMethod === 'online' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold">Online Payment</h3>
                                        <p className="text-xs text-muted-foreground">Pay securely via bKash, Nagad or Rocket.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>৳{formatMoney(checkoutData.subtotal)}</span>
                            </div>
                            {checkoutData.voucherDiscount && checkoutData.voucherDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Ticket className="h-3.5 w-3.5" />
                                        <span>Voucher ({checkoutData.voucherCode})</span>
                                    </div>
                                    <span>- ৳{formatMoney(checkoutData.voucherDiscount)}</span>
                                </div>
                            ) : null}
                            {checkoutData.coinDiscount && checkoutData.coinDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-yellow-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Coins className="h-3.5 w-3.5" />
                                        <span>Coin Discount</span>
                                    </div>
                                    <span>- ৳{formatMoney(checkoutData.coinDiscount)}</span>
                                </div>
                            ) : null}
                            {checkoutData.spinDiscount && checkoutData.spinDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-indigo-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Lucky Spin ({checkoutData.spinDiscountPercentage}%)</span>
                                    </div>
                                    <span>- ৳{formatMoney(checkoutData.spinDiscount)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping Fee</span>
                                <span>৳{formatMoney(checkoutData.shippingFee)}</span>
                            </div>
                            {paymentMethod === 'cash-on-delivery' && cashOnDeliveryFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">COD Fee</span>
                                    <span>৳{formatMoney(cashOnDeliveryFee)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-black text-xl text-primary">
                                <span>Final Total</span>
                                <span>৳{formatMoney(finalTotal)}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                           {paymentMethod === 'cash-on-delivery' ? (
                                <Button size="lg" className="w-full font-bold" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                                    {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                                    Confirm Order (৳{formatMoney(finalTotal)})
                                </Button>
                            ) : paymentMethod === 'online' ? (
                                 <Button size="lg" className="w-full font-bold" onClick={handleOnlinePayment} disabled={isNavigating}>
                                    {isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    Continue to Online Payment
                                </Button>
                            ) : (
                                <Button size="lg" className="w-full" disabled>Select Payment Method</Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default withAuth(PaymentPage);
