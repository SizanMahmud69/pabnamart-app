
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
    const { products } = useProducts();
    const wishlistItems = products.slice(0, 3); // Mock data

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
                {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {wishlistItems.map(item => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-center py-20">
                            <Heart className="mx-auto h-20 w-20 text-muted-foreground" />
                            <h2 className="mt-6 text-2xl font-bold">Your wishlist is empty</h2>
                            <p className="mt-2 text-muted-foreground">
                                Looks like you haven't added anything to your wishlist yet.
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/">Continue Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
