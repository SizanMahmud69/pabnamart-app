
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useVouchers } from "@/hooks/useVouchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Voucher, ShippingAddress as ShippingAddressType } from "@/types";
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
import { placeOrder } from "@/app/actions";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useDeliveryCharge } from "@/hooks/useDeliveryCharge";

const db = getFirestore(app);

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
  const { cartItems, cartTotal, cartCount, updateQuantity, clearCart } = useCart();
  const { user, appUser } = useAuth();
  const { collectedVouchers } = useVouchers();
  const { chargeInsidePabna, chargeOutsidePabna } = useDeliveryCharge();

  const [addresses, setAddresses] = useState<ShippingAddressType[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
      if (!user) return;
      setLoadingAddresses(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
              const userData = docSnap.data();
              const userAddresses = userData.shippingAddresses || [];
              setAddresses(userAddresses);
              const defaultAddress = userAddresses.find((a: ShippingAddressType) => a.default);
              setSelectedAddressId(defaultAddress?.id || (userAddresses[0] ? userAddresses[0].id : undefined));
          }
          setLoadingAddresses(false);
      });
      return () => unsubscribe();
  }, [user]);

  const availableVouchers = useMemo(() => {
    const usedCodes = appUser?.usedVoucherCodes || [];
    return collectedVouchers.filter(v => !v.isReturnVoucher && !usedCodes.includes(v.code));
  }, [collectedVouchers, appUser]);

  const returnVouchers = useMemo(() => {
      return collectedVouchers.filter(v => v.isReturnVoucher);
  }, [collectedVouchers]);


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

  const selectedAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId);
  }, [addresses, selectedAddressId]);
  
  const shippingFee = useMemo(() => {
    if (cartCount === 0) return 0;
    if (cartItems.some(item => item.freeShipping)) return 0;
    if (!selectedAddress) return chargeOutsidePabna; // Default fee if no address is selected yet

    return selectedAddress.city.toLowerCase().trim() === 'pabna' ? chargeInsidePabna : chargeOutsidePabna;

  }, [cartItems, cartCount, selectedAddress, chargeInsidePabna, chargeOutsidePabna]);

  const { orderDiscount, shippingDiscount } = useMemo(() => {
    if (!selectedVoucher) return { orderDiscount: 0, shippingDiscount: 0 };
    
    let calculatedDiscount = 0;
    if (selectedVoucher.type === 'fixed') {
      calculatedDiscount = selectedVoucher.discount;
    } else { // percentage
      calculatedDiscount = (cartTotal * selectedVoucher.discount) / 100;
    }

    if (selectedVoucher.discountType === 'shipping') {
      return { orderDiscount: 0, shippingDiscount: Math.min(calculatedDiscount, shippingFee) };
    }
    
    return { orderDiscount: calculatedDiscount, shippingDiscount: 0 };
  }, [selectedVoucher, cartTotal, shippingFee]);


  const subtotalWithDiscount = cartTotal - orderDiscount > 0 ? cartTotal - orderDiscount : 0;
  const shippingFeeWithDiscount = shippingFee - shippingDiscount > 0 ? shippingFee - shippingDiscount : 0;
  const finalTotal = subtotalWithDiscount + shippingFeeWithDiscount;

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (!selectedAddress) {
        toast({ title: "Error", description: "Please select a shipping address.", variant: "destructive"});
        return;
    }
    
    setIsPlacingOrder(true);
    
    if (selectedPaymentMethod === 'online') {
        const orderDetails = {
            cartItems,
            finalTotal,
            shippingAddress: selectedAddress,
            paymentMethod: selectedPaymentMethod,
            voucher: selectedVoucher
        };
        sessionStorage.setItem('orderDetails', JSON.stringify(orderDetails));
        router.push('/payment');
        return;
    }

    const { id, default: isDefault, ...shippingAddressData } = selectedAddress;

    try {
        const result = await placeOrder(user.uid, cartItems, finalTotal, shippingAddressData, selectedPaymentMethod, undefined, selectedVoucher);

        if (result.success) {
            toast({
                title: "Order Placed!",
                description: "Thank you for your purchase.",
            });
            clearCart();
            router.push('/account/orders?status=shipped');
        } else {
            toast({
                title: "Order Failed",
                description: result.message,
                variant: "destructive"
            });
        }
    } catch(err) {
         toast({
            title: "Order Failed",
            description: "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsPlacingOrder(false);
    }
  }
  
  if (loadingAddresses) {
      return <LoadingSpinner />;
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
                        <div className="flex justify-between items-center mb-2">
                           <Label>Select Address</Label>
                            <Button asChild variant="link" className="p-0 h-auto">
                                <Link href="/account/settings/addresses">Manage Addresses</Link>
                            </Button>
                        </div>
                        {addresses.length > 0 ? (
                             <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="mt-2 space-y-3">
                                {addresses.map((address) => (
                                    <Label key={address.id} htmlFor={address.id} className={cn(
                                        "flex flex-col p-4 rounded-lg border cursor-pointer transition-colors",
                                        selectedAddressId === address.id ? "border-primary ring-2 ring-primary" : "border-border"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <RadioGroupItem value={address.id} id={address.id} />
                                            {address.type === 'Home' ? <Home className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground" />}
                                            <div className="flex-grow">
                                                <p className="font-semibold">{address.type} {address.default && '(Default)'}</p>
                                                <p className="text-xs text-muted-foreground">{address.fullName}, {address.address}, {address.area}, {address.city}</p>
                                            </div>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        ) : (
                             <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No shipping address found.</p>
                                <Button asChild variant="link">
                                    <Link href="/account/settings/addresses">Add an Address</Link>
                                </Button>
                            </div>
                        )}
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

                 {(availableVouchers.length > 0 || returnVouchers.length > 0) && (
                    <div className="space-y-2">
                        <Label htmlFor="voucher">Apply Voucher</Label>
                        <Select onValueChange={handleApplyVoucher} defaultValue="none">
                            <SelectTrigger id="voucher">
                                <SelectValue placeholder="Select a voucher" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Voucher</SelectItem>
                                {returnVouchers.map(v => (
                                    <SelectItem key={v.code} value={v.code}>{v.code} - {v.description}</SelectItem>
                                ))}
                                {availableVouchers.map(v => (
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
                    <Button size="lg" className="w-1/2" onClick={handlePlaceOrder} disabled={isPlacingOrder || !selectedAddressId}>
                        {isPlacingOrder ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
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

    
