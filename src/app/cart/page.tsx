
"use client";

import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
        {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Cart Items ({cartCount})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4">
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                                    <Image
                                    src={item.images[0]}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="100px"
                                    data-ai-hint="product image"
                                    />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                    Price: ৳{item.price.toFixed(2)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button 
                                            variant="outline" size="icon" className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                            className="h-8 w-16 text-center"
                                            aria-label={`Quantity for ${item.name}`}
                                        />
                                        <Button 
                                            variant="outline" size="icon" className="h-8 w-8"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-lg">
                                        ৳{(item.price * item.quantity).toFixed(2)}
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
                    <span>Subtotal ({cartCount} items)</span>
                    <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-primary font-semibold">Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={handleCheckout}>
                        Proceed to Checkout
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
