
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy } from "lucide-react";
import type { PaymentSettings } from "@/types";
import type { OrderPayload } from "@/app/checkout/page";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { placeOrder } from "@/app/actions";
import { cn } from "@/lib/utils";
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from "@/components/LoadingSpinner";

const db = getFirestore(app);

const initialPaymentMethods = [
    { name: 'bKash', logo: '', merchantNumber: '', hint: 'bKash logo' },
    { name: 'Nagad', logo: '', merchantNumber: '', hint: 'Nagad logo' },
    { name: 'Rocket', logo: '', merchantNumber: '', hint: 'Rocket logo' },
];

function PaymentGatewayPage() {
    const [orderPayload, setOrderPayload] = useState<OrderPayload | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [trxId, setTrxId] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();
    const { user } = useAuth();
    const { clearCart } = useCart();
    const { toast } = useToast();

    useEffect(() => {
        const storedPayload = sessionStorage.getItem('orderPayload');
        const finalTotal = sessionStorage.getItem('finalTotalForPayment');

        if (storedPayload && finalTotal) {
            setOrderPayload(JSON.parse(storedPayload));
            setTotalAmount(Number(finalTotal));
        } else {
            router.push('/checkout');
            return;
        }

        const settingsDocRef = doc(db, 'settings', 'payment');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const parsedSettings = docSnap.data() as PaymentSettings;
                 setPaymentMethods(prevMethods => prevMethods.map(method => {
                    if (method.name === 'bKash') return { ...method, logo: parsedSettings.bkashLogo || method.logo, merchantNumber: parsedSettings.bkashMerchantNumber };
                    if (method.name === 'Nagad') return { ...method, logo: parsedSettings.nagadLogo || method.logo, merchantNumber: parsedSettings.nagadMerchantNumber };
                    if (method.name === 'Rocket') return { ...method, logo: parsedSettings.rocketLogo || method.logo, merchantNumber: parsedSettings.rocketMerchantNumber };
                    return method;
                }));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleConfirmPayment = async () => {
        if (!orderPayload || !user || !trxId || !paymentNumber || !selectedMethod) {
            toast({
                title: "Information Missing",
                description: "Please select a method and provide all details.",
                variant: "destructive"
            });
            return;
        }
        setIsProcessing(true);

        const payloadWithDetails: OrderPayload = {
            ...orderPayload,
            paymentDetails: {
                gateway: selectedMethod,
                transactionId: trxId,
                payerNumber: paymentNumber,
                merchantNumber: paymentMethods.find(m => m.name === selectedMethod)?.merchantNumber || ''
            }
        };

        try {
            const result = await placeOrder(payloadWithDetails);

            if (result.success && result.orderId) {
                toast({
                    title: "Order Placed!",
                    description: "Your payment will be verified within 10 minutes.",
                });
                clearCart();
                sessionStorage.removeItem('orderPayload');
                sessionStorage.removeItem('finalTotalForPayment');
                router.push(`/account/orders/${result.orderId}`);
            } else {
                toast({
                    title: "Order Failed",
                    description: result.message || "Something went wrong.",
                    variant: "destructive"
                });
                setIsProcessing(false);
            }
        } catch (error) {
             toast({
                title: "Order Failed",
                description: "An unexpected error occurred while placing your order.",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    const handleCopyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Merchant number copied to clipboard." });
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
            <div className="container mx-auto max-w-md px-4 py-8">
                <Card>
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-2xl">Select Payment Method</CardTitle>
                        <CardDescription>
                            Please pay the following amount to complete your purchase.
                        </CardDescription>
                        <p className="text-4xl font-bold text-primary pt-2">
                            ৳{totalAmount}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {paymentMethods.filter(m => m.logo && m.merchantNumber).map(method => (
                                <div
                                    key={method.name}
                                    className={cn(
                                        "border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all",
                                        selectedMethod === method.name ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                                    )}
                                    onClick={() => setSelectedMethod(method.name)}
                                >
                                    <div className="relative w-[60px] h-[36px]">
                                        <img src={method.logo} alt={method.name} style={{ objectFit: 'contain', width: '100%', height: '100%' }} data-ai-hint={method.hint} />
                                    </div>
                                    <p className="text-sm font-semibold mt-2">{method.name}</p>
                                </div>
                            ))}
                        </div>

                        {selectedMethod && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-semibold text-center">Pay with {selectedMethod}</h3>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                    <Label>Merchant Number</Label>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <p className="text-lg font-bold tracking-widest">{paymentMethods.find(m => m.name === selectedMethod)?.merchantNumber}</p>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyToClipboard(paymentMethods.find(m => m.name === selectedMethod)?.merchantNumber || '')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trxId">Transaction ID</Label>
                                    <Input id="trxId" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="Enter the TrxID here" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="paymentNumber">Your {selectedMethod} Number</Label>
                                    <Input id="paymentNumber" value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} placeholder="e.g., 01xxxxxxxxx" />
                                </div>
                                <Button size="lg" className="w-full" onClick={handleConfirmPayment} disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : 'Confirm Payment'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(PaymentGatewayPage);
