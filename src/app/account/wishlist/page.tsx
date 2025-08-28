
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { withAuth } from "@/hooks/useAuth";

function WishlistPage() {
    const { wishlistItems, removeFromWishlist } = useWishlist();

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
                {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {wishlistItems.map(item => (
                             <div key={item.id} className="relative group">
                                <ProductCard product={item} />
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeFromWishlist(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
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

export default withAuth(WishlistPage);
