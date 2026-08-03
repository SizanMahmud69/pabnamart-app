
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
import { placeOrder } from "@/lib/order-service";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, ShippingAddress, PaymentSettings } from "@/types";
import { Loader2, ArrowLeft, Copy, Coins, Ticket, Sparkles } from "lucide-react";
import Link from "next/link";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
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

function OnlinePaymentPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();
    
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentAccountNumber, setPaymentAccountNumber] = useState('');
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

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: "Merchant number copied to clipboard." });
        }, (err) => {
            toast({ title: "Error", description: "Failed to copy number.", variant: "destructive" });
        });
    };

    const handlePlaceOrder = () => {
        if (!checkoutData || !user) return;
        if (!paymentMethod) {
            toast({ title: "Payment Method", description: "Please select a payment method.", variant: "destructive" });
            return;
        }
        if (!paymentAccountNumber) {
            toast({ title: "Payment Account Number", description: "Please enter the account number you paid from.", variant: "destructive" });
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
                paymentAccountNumber,
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

    if (!checkoutData || !paymentSettings) {
        return <LoadingSpinner />;
    }

    const { total } = checkoutData;
    const selectedMethod = paymentSettings.methods.find(m => m.name === paymentMethod);
    const merchantNumber = selectedMethod ? selectedMethod.merchantNumber : '';

    return (
        <div className="bg-purple-50/30 min-h-screen pb-20">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/payment">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payment Selection
                    </Link>
                </Button>

                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>৳{checkoutData.subtotal.toFixed(2)}</span>
                            </div>
                            {checkoutData.voucherDiscount && checkoutData.voucherDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Ticket className="h-3.5 w-3.5" />
                                        <span>Voucher Discount</span>
                                    </div>
                                    <span>- ৳{checkoutData.voucherDiscount.toFixed(2)}</span>
                                </div>
                            ) : null}
                            {checkoutData.coinDiscount && checkoutData.coinDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-yellow-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Coins className="h-3.5 w-3.5" />
                                        <span>Coin Discount</span>
                                    </div>
                                    <span>- ৳{checkoutData.coinDiscount.toFixed(2)}</span>
                                </div>
                            ) : null}
                            {checkoutData.spinDiscount && checkoutData.spinDiscount > 0 ? (
                                <div className="flex justify-between text-sm text-indigo-600 font-medium">
                                    <div className="flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Lucky Spin ({checkoutData.spinDiscountPercentage}%)</span>
                                    </div>
                                    <span>- ৳{checkoutData.spinDiscount.toFixed(2)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping Fee</span>
                                <span>৳{checkoutData.shippingFee.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-black text-xl text-primary">
                                <span>Payable Amount</span>
                                <span>৳{total}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                            <CardDescription>Select a gateway and enter transaction info.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                <h3 className="font-semibold mb-2">Select a Gateway</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {paymentSettings.methods.map((method) => (
                                        <Label key={method.id} htmlFor={method.id} className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                            <RadioGroupItem value={method.name} id={method.id} />
                                            {method.logo && <img src={method.logo} alt={method.name} className="h-8 object-contain" />}
                                            <span className="flex-grow font-bold">{method.name}</span>
                                        </Label>
                                    ))}
                                </div>
                            </RadioGroup>

                            {paymentMethod && (
                                <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-center space-y-2">
                                        <p className="text-sm">Please send <span className="font-black text-primary">৳{total}</span> to this {paymentMethod} number:</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="font-mono text-2xl font-black tracking-tighter text-foreground">
                                                {merchantNumber}
                                            </span>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyToClipboard(merchantNumber)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Merchant Payment / Send Money</p>
                                    </div>
                                    
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paymentAccount">Your {paymentMethod} Number</Label>
                                            <Input id="paymentAccount" placeholder="e.g., 01xxxxxxxxx" value={paymentAccountNumber} onChange={(e) => setPaymentAccountNumber(e.target.value)} required />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="trxId">Transaction ID</Label>
                                            <Input id="trxId" placeholder="e.g., 8K29ML0PX" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" className="w-full font-bold" onClick={handlePlaceOrder} disabled={isPlacingOrder || !paymentMethod || !transactionId || !paymentAccountNumber}>
                                {isPlacingOrder ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Placing Order...</>
                                ) : (
                                    `Confirm Payment (৳${total})`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default withAuth(OnlinePaymentPage);
