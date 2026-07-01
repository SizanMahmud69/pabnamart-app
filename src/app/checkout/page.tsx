
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
import { ArrowLeft, Loader2, Home, Building, Plus, Ticket, AlertCircle, Coins, Sparkles, Clock, Trophy } from "lucide-react";
import Link from 'next/link';
import type { ShippingAddress, Voucher } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import AddressFormModal from "@/components/AddressFormModal";
import { getDoc, getFirestore, doc, updateDoc, arrayUnion, setDoc, onSnapshot } from 'firebase/firestore';
import app from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

function CheckoutPage() {
    const { user, appUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { 
        selectedCartItems: cartItems, 
        selectedCartTotal, 
        shippingFee,
        selectedShippingAddress,
        setSelectedShippingAddress,
    } = useCart();
    const { collectedVouchers } = useVouchers();

    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [useCoins, setUseCoins] = useState(false);
    const [isProceeding, startProceeding] = useTransition();

    const [spinDiscountTimeLeft, setSpinDiscountTimeLeft] = useState<number | null>(null);
    
    useEffect(() => {
        if (user) {
            const db = getFirestore(app);
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const userAddresses = userData.shippingAddresses || [];
                    setAddresses(userAddresses);
                    
                    if (!selectedShippingAddress && userAddresses.length > 0) {
                        const defaultAddress = userAddresses.find((a: ShippingAddress) => a.default) || userAddresses[0];
                        setSelectedShippingAddress(defaultAddress);
                    }
                }
            });
            return () => unsubscribe();
        }
    }, [user, selectedShippingAddress, setSelectedShippingAddress]);

    useEffect(() => {
        if (appUser?.spinDiscountExpiry) {
            const expiry = new Date(appUser.spinDiscountExpiry).getTime();
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const diff = expiry - now;
                if (diff <= 0) {
                    setSpinDiscountTimeLeft(null);
                    clearInterval(interval);
                } else {
                    setSpinDiscountTimeLeft(Math.floor(diff / 1000));
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [appUser]);
    
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
        setSelectedShippingAddress(newAddress);
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
    
    const subtotalWithVoucher = useMemo(() => {
        let currentSubtotal = selectedCartTotal;
        if (appliedVoucher && appliedVoucher.discountType !== 'shipping') {
            let discount = appliedVoucher.type === 'fixed' ? appliedVoucher.discount : (selectedCartTotal * appliedVoucher.discount) / 100;
            currentSubtotal = Math.max(0, selectedCartTotal - discount);
        }
        return currentSubtotal;
    }, [selectedCartTotal, appliedVoucher]);

    const coinDiscount = useMemo(() => {
        if (!useCoins || !appUser?.coins) return 0;
        const maxCoinsToUse = 100; // 10 Taka limit
        const coinsToUse = Math.min(appUser.coins, maxCoinsToUse);
        return coinsToUse / 10;
    }, [useCoins, appUser]);

    const hasSpinDiscount = useMemo(() => {
        return !!(appUser?.activeSpinDiscount && spinDiscountTimeLeft !== null);
    }, [appUser, spinDiscountTimeLeft]);

    const spinDiscountAmount = useMemo(() => {
        if (!hasSpinDiscount || !appUser?.activeSpinDiscount) return 0;
        const baseForSpin = subtotalWithVoucher - coinDiscount;
        return (baseForSpin * appUser.activeSpinDiscount) / 100;
    }, [hasSpinDiscount, appUser, subtotalWithVoucher, coinDiscount]);
    
    const shippingFeeWithDiscount = useMemo(() => {
        if (appliedVoucher?.discountType === 'shipping') return 0;
        return shippingFee;
    }, [shippingFee, appliedVoucher]);

    const finalTotal = Math.round(subtotalWithVoucher - coinDiscount - spinDiscountAmount + shippingFeeWithDiscount);
    
    const handleAddressChange = (addressId: string) => {
        const address = addresses.find(a => a.id === addressId);
        if (address) {
            setSelectedShippingAddress(address);
        }
    };

    const handleProceedToPayment = () => {
        if (!selectedShippingAddress) {
            toast({ title: "No Address Selected", description: "Please select a shipping address.", variant: "destructive" });
            return;
        }
        
        startProceeding(() => {
            const referrerId = localStorage.getItem('referrerId');
            sessionStorage.setItem('checkoutData', JSON.stringify({
                items: cartItems,
                shippingAddress: selectedShippingAddress,
                shippingFee: shippingFeeWithDiscount,
                total: finalTotal,
                subtotal: selectedCartTotal,
                voucherCode: appliedVoucher?.code,
                useCoins: useCoins,
                useSpinDiscount: hasSpinDiscount,
                referrerId: referrerId || undefined,
            }));
            router.push('/payment');
        });
    };

    if (cartItems.length === 0) {
        return <LoadingSpinner />;
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
                                        <RadioGroup value={selectedShippingAddress?.id || ''} onValueChange={handleAddressChange} className="space-y-4">
                                            {addresses.map(address => (
                                                <div key={address.id} className={cn("p-4 rounded-lg border", selectedShippingAddress?.id === address.id && "border-primary ring-1 ring-primary")}>
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
                                            <div key={item.cartItemId} className="flex items-center gap-4">
                                                <img src={item.images[0]} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold flex items-center gap-2">
                                                        {item.name}
                                                        {item.isB1G1 && (
                                                            <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200 text-[10px] h-5 px-1.5 font-black uppercase">B1G1</Badge>
                                                        )}
                                                    </p>
                                                    {(item.color || item.size) && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.color}{item.color && item.size && ', '}{item.size}
                                                        </p>
                                                    )}
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
                             {/* Lucky Spin Discount Display */}
                             {hasSpinDiscount && (
                                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
                                    <CardContent className="p-4 relative">
                                        <Sparkles className="absolute top-2 right-2 h-12 w-12 opacity-20 rotate-12" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                                    <Trophy className="h-6 w-6 text-yellow-300" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-lg tracking-tight">EXTRA {appUser?.activeSpinDiscount}% OFF!</p>
                                                    <p className="text-xs opacity-90 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Expiring in: <span className="font-bold font-mono">{formatTime(spinDiscountTimeLeft!)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-yellow-400 text-purple-900 font-bold border-0">ACTIVE</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                             )}

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

                            <Card className="border-yellow-200 bg-yellow-50/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-yellow-400 p-1.5 rounded-full">
                                                <Coins className="h-5 w-5 text-yellow-900" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Use Coins</p>
                                                <p className="text-xs text-muted-foreground">You have {appUser?.coins || 0} coins</p>
                                            </div>
                                        </div>
                                        <Checkbox 
                                            id="use-coins" 
                                            checked={useCoins} 
                                            onCheckedChange={(checked) => setUseCoins(checked as boolean)}
                                            disabled={!appUser?.coins || appUser.coins === 0}
                                        />
                                    </div>
                                    {useCoins && appUser?.coins && (
                                        <div className="mt-3 p-2 bg-yellow-100/50 rounded-md border border-yellow-200 text-xs flex justify-between">
                                            <span>Applying {Math.min(appUser.coins, 100)} coins discount</span>
                                            <span className="font-bold">- ৳{coinDiscount}</span>
                                        </div>
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
                                        <div className="flex justify-between text-green-600 text-sm">
                                            <span>Voucher Discount</span>
                                            <span>- ৳{(selectedCartTotal - subtotalWithVoucher).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {coinDiscount > 0 && (
                                        <div className="flex justify-between text-yellow-600 text-sm">
                                            <span>Coin Discount</span>
                                            <span>- ৳{coinDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {spinDiscountAmount > 0 && (
                                        <div className="flex justify-between text-indigo-600 font-bold text-sm">
                                            <span>Lucky Spin ({appUser?.activeSpinDiscount}%)</span>
                                            <span>- ৳{spinDiscountAmount.toFixed(2)}</span>
                                        </div>
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
                                    <Button size="lg" className="w-full" onClick={handleProceedToPayment} disabled={!selectedShippingAddress || isProceeding}>
                                        {isProceeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isProceeding ? "Processing..." : "Proceed to Payment"}
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
