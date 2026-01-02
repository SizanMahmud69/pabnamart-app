
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withAuth, useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useVouchers } from "@/hooks/useVouchers";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Home, Building, Plus, Ticket, AlertCircle } from "lucide-react";
import Link from 'next/link';
import type { ShippingAddress, Voucher } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import AddressFormModal from "@/components/AddressFormModal";
import { getDoc, getFirestore, doc, updateDoc, arrayUnion, setDoc, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

function CheckoutPage() {
    const { user, appUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { 
        selectedCartItems: cartItems, 
        selectedCartTotal, 
        shippingFee,
    } = useCart();
    const { collectedVouchers } = useVouchers();

    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    
    useEffect(() => {
        if (user) {
            const db = getFirestore(app);
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const userAddresses = userData.shippingAddresses || [];
                    setAddresses(userAddresses);
                    if (!selectedAddressId) {
                        const defaultAddress = userAddresses.find((a: ShippingAddress) => a.default);
                        if (defaultAddress) {
                            setSelectedAddressId(defaultAddress.id);
                        } else if (userAddresses.length > 0) {
                            setSelectedAddressId(userAddresses[0].id);
                        }
                    }
                }
            });
            return () => unsubscribe();
        }
    }, [user, selectedAddressId]);
    
    useEffect(() => {
        if (cartItems.length === 0) {
            router.replace('/cart');
        }
    }, [cartItems, router]);
    
    const handleSaveAddress = async (address: Omit<ShippingAddress, 'id' | 'default'>) => {
        if (!user) return;
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', user.uid);
        
        const newAddress: ShippingAddress = {
            ...address,
            id: Date.now().toString(),
            default: addresses.length === 0,
        };

        await updateDoc(userDocRef, {
            shippingAddresses: arrayUnion(newAddress)
        });
        
        toast({ title: "Address Added", description: "Your new address has been saved." });
        setSelectedAddressId(newAddress.id);
        setIsAddressModalOpen(false);
    };

    const handleApplyVoucher = () => {
        setVoucherError(null);
        setAppliedVoucher(null);
        if (!voucherCode) {
            setVoucherError("Please enter a voucher code.");
            return;
        }

        const voucher = collectedVouchers.find(v => v.code === voucherCode);

        if (!voucher) {
            setVoucherError("Invalid or not collected voucher code.");
            return;
        }
        
        if (voucher.minSpend && selectedCartTotal < voucher.minSpend) {
            setVoucherError(`Minimum spend of ৳${voucher.minSpend} is required.`);
            return;
        }
        
        if (appUser) {
            const currentUsage = appUser.usedVouchers?.[voucherCode] || 0;
            if (voucher.usageLimit && currentUsage >= voucher.usageLimit) {
                setVoucherError("You have reached the usage limit for this voucher.");
                return;
            }
        }
        
        setAppliedVoucher(voucher);
        toast({ title: "Voucher Applied!", description: `You've got a discount with ${voucher.code}.` });
    };
    
    const subtotalWithDiscount = useMemo(() => {
        if (!appliedVoucher || appliedVoucher.discountType === 'shipping') return selectedCartTotal;
        let discount = 0;
        if (appliedVoucher.type === 'fixed') {
            discount = appliedVoucher.discount;
        } else {
            discount = (selectedCartTotal * appliedVoucher.discount) / 100;
        }
        return Math.max(0, selectedCartTotal - discount);
    }, [selectedCartTotal, appliedVoucher]);
    
    const shippingFeeWithDiscount = useMemo(() => {
        if (appliedVoucher?.discountType === 'shipping') return 0;
        return shippingFee;
    }, [shippingFee, appliedVoucher]);

    const finalTotal = Math.round(subtotalWithDiscount + shippingFeeWithDiscount);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    
    const handleProceedToPayment = () => {
        if (!selectedAddress) {
            toast({ title: "No Address Selected", description: "Please select a shipping address.", variant: "destructive" });
            return;
        }
        
        sessionStorage.setItem('checkoutData', JSON.stringify({
            items: cartItems,
            shippingAddress: selectedAddress,
            shippingFee: shippingFeeWithDiscount,
            total: finalTotal,
            subtotal: selectedCartTotal,
            voucherCode: appliedVoucher?.code,
        }));
        router.push('/payment');
    };

    if (cartItems.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto max-w-2xl px-4 py-6">
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/cart">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Cart
                        </Link>
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle>Shipping Address</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsAddressModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Add New</Button>
                                </CardHeader>
                                <CardContent>
                                    {addresses.length > 0 ? (
                                        <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId} className="space-y-4">
                                            {addresses.map(address => (
                                                <div key={address.id} className={cn("p-4 rounded-lg border", selectedAddressId === address.id && "border-primary ring-1 ring-primary")}>
                                                    <div className="flex items-start gap-4">
                                                        <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="mt-1" />
                                                        <Label htmlFor={`addr-${address.id}`} className="flex-1 cursor-pointer">
                                                            <div className="flex items-center gap-2 font-semibold">
                                                                {address.type === 'Home' ? <Home className="h-4 w-4 text-muted-foreground" /> : <Building className="h-4 w-4 text-muted-foreground" />}
                                                                {address.type}
                                                                {address.default && <Badge variant="secondary">Default</Badge>}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                                                <p className="font-medium text-foreground">{address.fullName}</p>
                                                                <p>{address.phone}</p>
                                                                <p>{address.address}, {address.area}, {address.city}</p>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                            <p className="text-muted-foreground">No shipping addresses found.</p>
                                            <Button variant="link" onClick={() => setIsAddressModalOpen(true)}>Add your first address</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <div className="space-y-4">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <img src={item.images[0]} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold">৳{item.price * item.quantity}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            
                        </div>

                        <div className="sticky top-24 space-y-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" />Apply Voucher</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {appliedVoucher ? (
                                        <div className="flex justify-between items-center p-3 bg-green-100 text-green-800 rounded-md">
                                            <p className="font-semibold">Applied: {appliedVoucher.code}</p>
                                            <Button variant="ghost" size="sm" onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}>Remove</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-2">
                                                <Input placeholder="Enter voucher code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} />
                                                <Button onClick={handleApplyVoucher}>Apply</Button>
                                            </div>
                                            {voucherError && (
                                                <Alert variant="destructive" className="mt-2 text-xs p-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>{voucherError}</AlertDescription>
                                                </Alert>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between"><span>Subtotal</span><span>৳{selectedCartTotal}</span></div>
                                    {appliedVoucher?.discountType !== 'shipping' && appliedVoucher?.discount > 0 && (
                                        <div className="flex justify-between text-green-600"><span>Voucher Discount</span><span>- ৳{(selectedCartTotal - subtotalWithDiscount).toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between"><span>Shipping Fee</span>
                                        {appliedVoucher?.discountType === 'shipping' ? (
                                            <Badge className="bg-green-100 text-green-800">Free</Badge>
                                        ) : (
                                            <span>৳{shippingFee}</span>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>৳{finalTotal}</span></div>
                                </CardContent>
                                <CardFooter>
                                    <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={!selectedAddress}>
                                        Proceed to Payment
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <AddressFormModal 
                isOpen={isAddressModalOpen} 
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleSaveAddress}
                address={null}
            />
        </>
    );
}

export default withAuth(CheckoutPage);
