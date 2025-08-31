
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/useWishlist";

export default function AddToCartButton({ product, isFlashSaleContext = false }: { product: Product, isFlashSaleContext?: boolean }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const isSoldOut = product.stock === 0;

  const handleBuyNow = () => {
    setIsLoading(true);
    addToCart(product, isFlashSaleContext);
    router.push('/checkout');
  }
  
  const handleAddToWishlist = () => {
    addToWishlist(product);
  }

  if (isSoldOut) {
    return (
      <Button size="lg" className="w-full" onClick={handleAddToWishlist} disabled={isInWishlist(product.id)}>
        <Heart className="mr-2 h-5 w-5" />
        {isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
      </Button>
    )
  }

  return (
    <div className="flex gap-4">
      <Button size="lg" className="w-full" onClick={() => addToCart(product, isFlashSaleContext)} disabled={isLoading}>
        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
      </Button>
      <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-5 w-5" />
        )}
        {isLoading ? "Processing..." : "Buy Now"}
      </Button>
    </div>
  );
}
