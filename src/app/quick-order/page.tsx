
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Package, Truck, Phone, User, MapPin, Minus, Plus } from "lucide-react";
import Link from 'next/link';
import { useDeliveryCharge } from "@/hooks/useDeliveryCharge";
import { useProducts } from "@/hooks/useProducts";
import { placeOrder } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { Product, CartItem, ShippingAddress } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function QuickOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { getFlashSalePrice } = useProducts();
    const { 
        chargeInsidePabnaSmall, 
        chargeInsidePabnaLarge, 
        chargeOutsidePabnaSmall, 
        chargeOutsidePabnaLarge 
    } = useDeliveryCharge();

    const [isPending, startOrder] = useTransition();
    const [quickOrderData, setQuickOrderData] = useState<any>(null);
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [quantity, setQuantity] = useState(1);

    const product: Product | null = quickOrderData?.product || null;
    const isDecimalUnit = ['KG', 'Meter', 'Litre'].includes(product?.unit || '');
    const minQuantity = isDecimalUnit ? 0.250 : 1;

    useEffect(() => {
        const data = sessionStorage.getItem('quickOrderData');
        if (data) {
            const parsed = JSON.parse(data);
            setQuickOrderData(parsed);
            const initialQty = parsed.quantity || (['KG', 'Meter', 'Litre'].includes(parsed.product?.unit || '') ? 0.250 : 1);
            setQuantity(initialQty < minQuantity ? minQuantity : initialQty);
        } else {
            router.replace('/');
        }
    }, [router, minQuantity]);

    const variations = quickOrderData?.variations || {};
    const isFlashSaleContext = quickOrderData?.isFlashSaleContext || false;
    const isB1G1Context = quickOrderData?.isB1G1Context || false;

    const price = useMemo(() => {
        if (!product) return 0;
        return isFlashSaleContext ? getFlashSalePrice(product) : product.price;
    }, [product, isFlashSaleContext, getFlashSalePrice]);

    const shippingFee = useMemo(() => {
        if (!product) return 0;
        if (product.freeShipping) return 0;
        
        const isInsidePabna = city.toLowerCase().trim() === 'pabna';
        return isInsidePabna ? chargeInsidePabnaSmall : chargeOutsidePabnaSmall;
    }, [product, city, chargeInsidePabnaSmall, chargeOutsidePabnaSmall]);

    const total = Math.round(price * quantity + shippingFee);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        if (!fullName || !phone || !address || !city || !area) {
            toast({ title: "Error", description: "Please fill all the details.", variant: "destructive" });
            return;
        }

        if (quantity < minQuantity) {
            toast({ title: "Error", description: `সর্বনিম্ন অর্ডার ${minQuantity} ${product.unit} হতে হবে।`, variant: "destructive" });
            return;
        }

        startOrder(async () => {
            const guestId = `guest_${Date.now()}`;
            const shippingAddress: ShippingAddress = {
                id: 'guest_addr',
                fullName,
                phone,
                address,
                city,
                area,
                type: 'Home',
                default: true
            };

            const cartItem: CartItem = {
                cartItemId: `quick_${product.id}`,
                id: product.id,
                name: product.name,
                price: price,
                originalPrice: product.originalPrice || product.price,
                images: product.images,
                stock: product.stock,
                quantity: quantity,
                freeShipping: product.freeShipping,
                category: product.category,
                unit: product.unit || 'Pcs',
                color: variations.color,
                size: variations.size,
                isB1G1: isB1G1Context && product.isB1G1,
            };

            const result = await placeOrder({
                userId: guestId,
                items: [cartItem],
                shippingAddress,
                shippingFee,
                paymentMethod: 'cash-on-delivery',
            });

            if (result.success && result.orderId) {
                toast({ title: "অর্ডার সফল হয়েছে!", description: "আপনার অর্ডারটি গ্রহণ করা হয়েছে।" });
                sessionStorage.removeItem('quickOrderData');
                router.replace(`/track-order?id=${result.orderId}`);
            } else {
                toast({ title: "অর্ডার ব্যর্থ হয়েছে", description: result.message || "আবার চেষ্টা করুন।", variant: "destructive" });
            }
        });
    };

    if (!product) return <LoadingSpinner />;

    return (
        <div className="bg-purple-50/30 min-h-screen pb-12">
            <div className="container mx-auto max-w-2xl px-4 py-6">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href={`/products/${product.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        ফিরে যান
                    </Link>
                </Button>

                <h1 className="text-3xl font-black text-primary mb-6 text-center uppercase italic tracking-tighter">সরাসরি অর্ডার করুন</h1>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="shadow-lg border-2 border-primary/10">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                আপনার তথ্য দিন
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form id="quick-order-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">সম্পূর্ণ নাম</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="fullName" 
                                            placeholder="আপনার নাম লিখুন" 
                                            className="pl-9"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">মোবাইল নম্বর</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="phone" 
                                            type="tel"
                                            placeholder="১১ ডিজিটের নম্বরটি লিখুন" 
                                            className="pl-9 font-mono"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">শহর / জেলা</Label>
                                        <Input 
                                            id="city" 
                                            placeholder="যেমন: পাবনা" 
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="area">উপজেলা / এলাকা</Label>
                                        <Input 
                                            id="area" 
                                            placeholder="যেমন: ঈশ্বরদী" 
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">সম্পূর্ণ ঠিকানা</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="address" 
                                            placeholder="গ্রাম, রাস্তা বা বাড়ির নম্বর লিখুন" 
                                            className="pl-9"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-2 border-primary/10 overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                অর্ডারের বিবরণ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg">
                                <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border bg-white">
                                    <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        {variations.color && <Badge variant="outline" className="text-[10px]">{variations.color}</Badge>}
                                        {variations.size && <Badge variant="outline" className="text-[10px]">{variations.size}</Badge>}
                                        {isB1G1Context && product.isB1G1 && (
                                            <Badge className="bg-pink-100 text-pink-700 text-[10px]">B1G1</Badge>
                                        )}
                                    </div>
                                    <p className="font-black text-primary mt-1">৳{price}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">কতটুকু নিতে চান? ({product.unit || 'Pcs'})</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-md h-10 overflow-hidden bg-background">
                                        <Button 
                                            variant="ghost" size="icon" className="h-full w-10 rounded-none border-r"
                                            onClick={() => setQuantity(prev => Math.max(isDecimalUnit ? prev - 0.1 : prev - 1, minQuantity))}
                                            disabled={quantity <= minQuantity}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input 
                                            type="number" 
                                            step={isDecimalUnit ? "0.001" : "1"}
                                            min={minQuantity}
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setQuantity(val);
                                            }}
                                            onBlur={() => {
                                                if (quantity < minQuantity) setQuantity(minQuantity);
                                            }}
                                            className="w-20 border-0 text-center h-full focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                                        />
                                        <Button 
                                            variant="ghost" size="icon" className="h-full w-10 rounded-none border-l"
                                            onClick={() => setQuantity(prev => isDecimalUnit ? prev + 0.1 : prev + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">পণ্যের দাম ({quantity} {product.unit || 'Pcs'})</span>
                                    <span className="font-bold">৳{(price * quantity).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                                    {shippingFee === 0 ? (
                                        <span className="text-green-600 font-bold">ফ্রি ডেলিভারি</span>
                                    ) : (
                                        <span className="font-bold">৳{shippingFee}</span>
                                    )}
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-lg font-black text-primary">
                                    <span>সর্বমোট</span>
                                    <span>৳{total}</span>
                                </div>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-center gap-3">
                                <Truck className="h-5 w-5 text-green-600" />
                                <div className="text-xs text-green-700 font-medium leading-tight">
                                    পণ্য হাতে পেয়ে টাকা পরিশোধ করুন (ক্যাশ অন ডেলিভারি)
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/5 p-4 border-t">
                            <Button 
                                type="submit" 
                                form="quick-order-form" 
                                className="w-full h-14 text-xl font-black uppercase tracking-tighter" 
                                disabled={isPending || quantity <= 0}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                        প্রসেসিং হচ্ছে...
                                    </>
                                ) : (
                                    'অর্ডার কনফার্ম করুন'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
