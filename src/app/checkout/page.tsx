
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useVouchers } from "@/hooks/useVouchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Voucher } from "@/types";
import { CreditCard, Banknote, Truck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const { collectedVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleApplyVoucher = (code: string) => {
    const voucher = collectedVouchers.find(v => v.code === code);
    if (!voucher) {
      setSelectedVoucher(null);
      setDiscount(0);
      setError(null);
      return;
    }

    if (voucher.minSpend && cartTotal < voucher.minSpend) {
        setError(`You need to spend at least ৳${voucher.minSpend} to use this voucher.`);
        setDiscount(0);
        setSelectedVoucher(null);
        return;
    }

    setError(null);
    setSelectedVoucher(voucher);

    if (voucher.type === 'fixed') {
      setDiscount(voucher.discount);
    } else {
      setDiscount((cartTotal * voucher.discount) / 100);
    }
  };

  const finalTotal = cartTotal - discount > 0 ? cartTotal - discount : 0;
  const shippingFee = 50;

  if (cartCount === 0) {
    return (
        <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
            <div className="text-center">
                 <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                 <p className="text-muted-foreground mb-6">Add some products to proceed to checkout.</p>
                 <Button asChild>
                    <Link href="/">Continue Shopping</Link>
                 </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="bg-purple-50/30 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>You have {cartCount} item(s) in your cart.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                 </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Apply Voucher</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="voucher">Select a voucher</Label>
                        <Select onValueChange={handleApplyVoucher} disabled={collectedVouchers.length === 0}>
                            <SelectTrigger id="voucher">
                                <SelectValue placeholder={collectedVouchers.length > 0 ? "Select a voucher" : "No vouchers collected"} />
                            </SelectTrigger>
                            <SelectContent>
                                {collectedVouchers.map(v => (
                                    <SelectItem key={v.code} value={v.code}>{v.code} - {v.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {error && (
                        <Alert variant="destructive">
                           <AlertCircle className="h-4 w-4" />
                           <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                    {selectedVoucher && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount ({selectedVoucher.code})</span>
                            <span>- ৳{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span>Shipping Fee</span>
                        <span>৳{shippingFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total to Pay</span>
                        <span>৳{(finalTotal + shippingFee).toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full">
                        Place Order
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
