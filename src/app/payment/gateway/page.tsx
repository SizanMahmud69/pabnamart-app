
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy } from "lucide-react";
import type { CartItem, ShippingAddress, Voucher } from "@/types";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { placeOrder } from "@/app/actions";
import { cn } from "@/lib/utils";

interface OrderDetails {
    cartItems: CartItem[];
    finalTotal: number;
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    voucher: Voucher | null;
}

const paymentMethods = [
    { name: 'bKash', logo: 'https://picsum.photos/seed/bkash/100/60', merchantNumber: '01234567890', hint: 'bKash logo' },
    { name: 'Nagad', logo: 'https://picsum.photos/seed/nagad/100/60', merchantNumber: '01234567891', hint: 'Nagad logo' },
    { name: 'Rocket', logo: 'https://picsum.photos/seed/rocket/100/60', merchantNumber: '01234567892', hint: 'Rocket logo' },
];

function PaymentGatewayPage() {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [trxId, setTrxId] = useState('');
    const [paymentNumber, setPaymentNumber] = useState('');
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
        if (!orderDetails || !user || !trxId || !paymentNumber) {
            toast({
                title: "Information Missing",
                description: "Please provide Transaction ID and your payment number.",
                variant: "destructive"
            });
            return;
        }
        setIsProcessing(true);

        const { cartItems, finalTotal, shippingAddress, paymentMethod } = orderDetails;
        const { id, default: isDefault, ...shippingAddressData } = shippingAddress;

        // Simulate payment verification
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = await placeOrder(user.uid, cartItems, finalTotal, shippingAddressData, 'shipped'); // status becomes 'shipped' after payment

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

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Merchant number copied to clipboard." });
    }
    
    if (!orderDetails) {
        return null;
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
                        <p className="text-3xl font-bold text-primary pt-2">
                            ৳{orderDetails.finalTotal.toFixed(2)}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {paymentMethods.map(method => (
                                <div
                                    key={method.name}
                                    className={cn(
                                        "border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all",
                                        selectedMethod === method.name ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
                                    )}
                                    onClick={() => setSelectedMethod(method.name)}
                                >
                                    <Image src={method.logo} alt={method.name} width={60} height={36} data-ai-hint={method.hint} />
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
                                            Verifying Payment...
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
