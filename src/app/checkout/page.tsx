
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useVouchers } from "@/hooks/useVouchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Voucher } from "@/types";
import { CreditCard, Banknote, Truck, AlertCircle, Home, Building } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { withAuth, useAuth } from "@/hooks/useAuth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const addresses = [
    {
        id: 'home',
        type: 'Home Address',
        details: '123 Test Street, Mocktown, USA',
        default: true,
        icon: Home
    },
    {
        id: 'office',
        type: 'Office Address',
        details: '456 Work Ave, Business City, USA',
        default: false,
        icon: Building
    }
]

function CheckoutPage() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const { collectedVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(addresses.find(a => a.default)?.id || addresses[0].id);

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
        <div className="space-y-6">
            
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Full Name</Label>
                        <p className="font-semibold text-lg">{user?.displayName || "New User"}</p>
                    </div>
                    <div>
                        <Label>Select Address</Label>
                        <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="mt-2 space-y-3">
                            {addresses.map((address) => (
                                <Label key={address.id} htmlFor={address.id} className={cn(
                                    "flex flex-col p-4 rounded-lg border cursor-pointer transition-colors",
                                    selectedAddress === address.id ? "border-primary ring-2 ring-primary" : "border-border"
                                )}>
                                    <div className="flex items-center gap-4">
                                        <RadioGroupItem value={address.id} id={address.id} />
                                        <address.icon className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{address.type} {address.default && '(Default)'}</p>
                                            <p className="text-sm text-muted-foreground">{address.details}</p>
                                        </div>
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

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

export default withAuth(CheckoutPage);

    