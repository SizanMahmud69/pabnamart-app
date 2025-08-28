
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import type { CartItem, ShippingAddress, Voucher } from "@/types";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { placeOrder } from "../actions";

interface OrderDetails {
    cartItems: CartItem[];
    finalTotal: number;
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    voucher: Voucher | null;
}

function PaymentPage() {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();

    useEffect(() => {
        const storedDetails = sessionStorage.getItem('orderDetails');
        if (storedDetails) {
            setOrderDetails(JSON.parse(storedDetails));
        } else {
            router.push('/checkout');
        }
    }, [router]);

    const handleConfirmPayment = async () => {
        if (!orderDetails || !user) return;
        setIsProcessing(true);

        const { cartItems, finalTotal, shippingAddress, paymentMethod } = orderDetails;
        const { id, default: isDefault, ...shippingAddressData } = shippingAddress;

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = await placeOrder(user.uid, cartItems, finalTotal, shippingAddressData, paymentMethod);

        if (result.success) {
            toast({
                title: "Payment Successful!",
                description: "Your order has been placed.",
            });
            clearCart();
            sessionStorage.removeItem('orderDetails');
            router.push('/account/orders?status=shipped');
        } else {
            toast({
                title: "Payment Failed",
                description: result.message || "Something went wrong.",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };
    
    if (!orderDetails) {
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
                            <span>Total Amount</span>
                            <span>৳{orderDetails.finalTotal.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">Shipping to:</h4>
                            <p className="text-sm text-muted-foreground">
                                {orderDetails.shippingAddress.fullName}<br />
                                {orderDetails.shippingAddress.address}, {orderDetails.shippingAddress.area}, {orderDetails.shippingAddress.city}<br />
                                {orderDetails.shippingAddress.phone}
                            </p>
                        </div>
                        <Separator />
                        <div className="text-center">
                            <p className="text-muted-foreground">You will be redirected to a secure payment gateway.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handleConfirmPayment} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Pay Now
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

    