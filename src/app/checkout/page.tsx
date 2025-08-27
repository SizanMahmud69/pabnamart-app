
"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import { useVouchers } from "@/hooks/useVouchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Voucher } from "@/types";
import { CreditCard, Truck, AlertCircle, Home, Building, Minus, Plus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { withAuth, useAuth } from "@/hooks/useAuth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

const paymentMethods = [
    {
        id: 'cod',
        label: 'Cash on Delivery',
        icon: Truck
    },
    {
        id: 'online',
        label: 'Online Payment',
        icon: CreditCard
    }
]

function CheckoutPage() {
  const { cartItems, cartTotal, cartCount, updateQuantity } = useCart();
  const { user } = useAuth();
  const { collectedVouchers } = useVouchers();
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(addresses.find(a => a.default)?.id || addresses[0].id);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleApplyVoucher = (code: string) => {
    if (!code || code === "none") {
        setSelectedVoucher(null);
        setError(null);
        return;
    }

    const voucher = collectedVouchers.find(v => v.code === code);
    if (!voucher) {
      setSelectedVoucher(null);
      setError(null);
      return;
    }

    if (voucher.minSpend && cartTotal < voucher.minSpend) {
        setError(`You need to spend at least ৳${voucher.minSpend} to use this voucher.`);
        setSelectedVoucher(null);
        return;
    }

    setError(null);
    setSelectedVoucher(voucher);
  };

  const { orderDiscount, shippingDiscount } = useMemo(() => {
    if (!selectedVoucher) return { orderDiscount: 0, shippingDiscount: 0 };
    
    let calculatedDiscount = 0;
    if (selectedVoucher.type === 'fixed') {
      calculatedDiscount = selectedVoucher.discount;
    } else { // percentage
      calculatedDiscount = (cartTotal * selectedVoucher.discount) / 100;
    }

    if (selectedVoucher.discountType === 'shipping') {
      return { orderDiscount: 0, shippingDiscount: calculatedDiscount };
    }
    
    return { orderDiscount: calculatedDiscount, shippingDiscount: 0 };
  }, [selectedVoucher, cartTotal]);


  const shippingFee = 50;
  const subtotalWithDiscount = cartTotal - orderDiscount > 0 ? cartTotal - orderDiscount : 0;
  const shippingFeeWithDiscount = shippingFee - shippingDiscount > 0 ? shippingFee - shippingDiscount : 0;
  const finalTotal = subtotalWithDiscount + shippingFeeWithDiscount;

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);
    // Simulate order placement process
    setTimeout(() => {
        toast({
            title: "Order Placed!",
            description: "Thank you for your purchase.",
        });
        // In a real app, you would clear the cart here.
        router.push('/account/orders');
    }, 2000);
  }

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
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Select how you want to pay for your order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="grid grid-cols-2 gap-4">
                        {paymentMethods.map(method => (
                             <Label key={method.id} htmlFor={method.id} className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors h-28",
                                    selectedPaymentMethod === method.id ? "border-primary ring-2 ring-primary" : "border-border"
                                )}>
                                    <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                    <method.icon className="h-8 w-8 text-primary mb-2" />
                                    <span className="font-semibold">{method.label}</span>
                                </Label>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" data-ai-hint="product image" />
                                </div>
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                        <span>{item.quantity}</span>
                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            </div>
                            <span className="font-semibold">৳{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                 </div>
                 <Separator className="my-4" />

                 {collectedVouchers.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="voucher">Apply Voucher</Label>
                        <Select onValueChange={handleApplyVoucher} defaultValue="none">
                            <SelectTrigger id="voucher">
                                <SelectValue placeholder="Select a voucher" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Voucher</SelectItem>
                                {collectedVouchers.map(v => (
                                    <SelectItem key={v.code} value={v.code}>{v.code} - {v.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                 )}

                 <Separator className="my-4" />
                 <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                    {orderDiscount > 0 && (
                        <div className="flex justify-between text-primary">
                            <span>Discount ({selectedVoucher?.code})</span>
                            <span>- ৳{orderDiscount.toFixed(2)}</span>
                        </div>
                    )}
                     <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>৳{shippingFee.toFixed(2)}</span>
                    </div>
                    {shippingDiscount > 0 && (
                        <div className="flex justify-between text-primary">
                            <span>Shipping Discount ({selectedVoucher?.code})</span>
                            <span>- ৳{shippingDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>৳{finalTotal.toFixed(2)}</span>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-background py-4 border-t">
                <div className="container mx-auto max-w-3xl flex items-center justify-between">
                    <div className="text-lg font-bold">
                        <p className="text-sm text-muted-foreground">Total to Pay</p>
                        ৳{finalTotal.toFixed(2)}
                    </div>
                    <Button size="lg" className="w-1/2" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                        {isPlacingOrder ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Placing Order...
                            </>
                        ) : (
                            'Place Order'
                        )}
                    </Button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

export default withAuth(CheckoutPage);
