
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { placeOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, ShippingAddress, PaymentSettings } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";

interface CheckoutData {
    items: CartItem[];
    shippingAddress: ShippingAddress;
    shippingFee: number;
    total: number;
    subtotal: number;
    voucherCode?: string;
}

function OnlinePaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();
    
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isPlacingOrder, startOrderPlacement] = useTransition();
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

    useEffect(() => {
        const data = sessionStorage.getItem('checkoutData');
        if (data) {
            setCheckoutData(JSON.parse(data));
        } else {
            router.replace('/cart');
        }
    }, [router]);
    
    useEffect(() => {
        const db = getFirestore(app);
        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setPaymentSettings(docSnap.data() as PaymentSettings);
            }
        });
        return () => unsubscribe();
    }, []);

    const handlePlaceOrder = () => {
        if (!checkoutData || !user) return;
        if (!paymentMethod) {
            toast({ title: "Payment Method", description: "Please select a payment method.", variant: "destructive" });
            return;
        }
        if (!transactionId) {
            toast({ title: "Transaction ID", description: "Please enter the transaction ID.", variant: "destructive" });
            return;
        }

        startOrderPlacement(async () => {
            const result = await placeOrder({
                userId: user.uid,
                items: checkoutData.items,
                shippingAddress: checkoutData.shippingAddress,
                shippingFee: checkoutData.shippingFee,
                voucherCode: checkoutData.voucherCode,
                paymentMethod,
                transactionId,
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

    if (!checkoutData || !paymentSettings) {
        return <LoadingSpinner />;
    }

    const { total } = checkoutData;

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-lg px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/payment">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payment Selection
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Online Payment</CardTitle>
                        <CardDescription>Your final order total is ৳{total}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            <h3 className="font-semibold mb-2">Select a Gateway</h3>
                            
                            <Label htmlFor="bKash" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="bKash" id="bKash" />
                                {paymentSettings.bkashLogo && <img src={paymentSettings.bkashLogo} alt="bKash" className="h-8 object-contain" />}
                                <span className="flex-grow">bKash</span>
                            </Label>

                            <Label htmlFor="Nagad" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="Nagad" id="Nagad" />
                                {paymentSettings.nagadLogo && <img src={paymentSettings.nagadLogo} alt="Nagad" className="h-8 object-contain" />}
                                <span className="flex-grow">Nagad</span>
                            </Label>
                            
                            <Label htmlFor="Rocket" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="Rocket" id="Rocket" />
                                {paymentSettings.rocketLogo && <img src={paymentSettings.rocketLogo} alt="Rocket" className="h-8 object-contain" />}
                                <span className="flex-grow">Rocket</span>
                            </Label>
                        </RadioGroup>

                        {paymentMethod && (
                            <div className="space-y-2 pt-4 border-t">
                                <p>Please send <strong>৳{total}</strong> to our {paymentMethod} merchant number:</p>
                                <p className="font-mono text-lg font-bold text-center bg-muted p-2 rounded-md">
                                    {paymentMethod === 'bKash' && paymentSettings.bkashMerchantNumber}
                                    {paymentMethod === 'Nagad' && paymentSettings.nagadMerchantNumber}
                                    {paymentMethod === 'Rocket' && paymentSettings.rocketMerchantNumber}
                                </p>
                                <p>Then, enter the transaction ID below.</p>
                                <Label htmlFor="trxId">Transaction ID</Label>
                                <Input id="trxId" placeholder="Enter your transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={isPlacingOrder || !paymentMethod || !transactionId}>
                            {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPlacingOrder ? 'Placing Order...' : `Place Order (৳${total})`}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(OnlinePaymentPage);
