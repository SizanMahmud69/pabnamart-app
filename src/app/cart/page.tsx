
"use client";

import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
        {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4">
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
                            ৳{item.price.toFixed(2)}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                            <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                updateQuantity(item.id, parseInt(e.target.value))
                                }
                                className="h-9 w-20"
                                aria-label={`Quantity for ${item.name}`}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Remove ${item.name}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        </div>
                        <p className="font-semibold text-lg">
                            ৳{(item.price * item.quantity).toFixed(2)}
                        </p>
                        </div>
                    ))}
                    </div>
                </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card>
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
                    <span>Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild size="lg" className="w-full">
                        <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                </CardFooter>
                </Card>
            </div>
            </div>
        ) : (
            <div className="text-center py-20">
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
