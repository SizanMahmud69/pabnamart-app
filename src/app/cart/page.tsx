"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, ShoppingBag, Minus, Plus, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function CartPage() {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    selectedCartTotal, 
    selectedCartCount, 
    shippingFee,
    selectedItemIds,
    toggleSelectItem,
    toggleSelectAll,
    isAllSelected,
    selectedCartItems
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCheckout = () => {
    if (selectedCartCount === 0) {
        return;
    }
    setIsCheckingOut(true);
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login');
    }
  };

  const finalTotal = selectedCartTotal + (shippingFee || 0);

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
        {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="select-all" 
                                checked={isAllSelected}
                                onCheckedChange={toggleSelectAll}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4">
                                <Checkbox 
                                    className="mt-8 flex-shrink-0"
                                    checked={selectedItemIds.includes(item.id)}
                                    onCheckedChange={() => toggleSelectItem(item.id)}
                                />
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                                    <img
                                    src={item.images[0]}
                                    alt={item.name}
                                    className="object-cover w-full h-full"
                                    data-ai-hint="product image"
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold truncate">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                    Price: ৳{item.price}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button 
                                            variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                            className="h-8 w-14 text-center px-1"
                                            aria-label={`Quantity for ${item.name}`}
                                        />
                                        <Button 
                                            variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-semibold text-lg whitespace-nowrap">
                                        ৳{item.price * item.quantity}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mt-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeFromCart(item.id)}
                                        aria-label={`Remove ${item.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                    <span>Subtotal ({selectedCartCount} items)</span>
                    <span>৳{selectedCartTotal}</span>
                    </div>
                    <div className="flex justify-between">
                        <div>
                           <p>Shipping</p>
                           <p className="text-xs text-muted-foreground">(Based on default address)</p>
                        </div>
                        {isClient ? (
                            shippingFee === 0 && selectedCartCount > 0 ? (
                                <Badge className="bg-green-100 text-green-800">Free Delivery</Badge>
                            ) : (
                                <span>৳{shippingFee || 0}</span>
                            )
                        ) : (
                            <span>...</span>
                        )}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>{isClient ? `৳${finalTotal}` : '...'}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isCheckingOut || selectedCartCount === 0}>
                        {isCheckingOut ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Proceed to Checkout'
                        )}
                    </Button>
                </CardFooter>
                </Card>
            </div>
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <ShoppingBag className="mx-auto h-20 w-20 text-muted-foreground" />
                <h2 className="mt-6 text-2xl font-bold">Your cart is empty</h2>
                <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                <Button asChild className="mt-6">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        )}
        </div>
    </div>
  );
}
