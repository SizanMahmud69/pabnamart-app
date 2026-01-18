
"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export default function ProductActions({ product, isFlashSaleContext = false }: { product: Product, isFlashSaleContext?: boolean }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  const isSoldOut = product.stock === 0;
  const hasVariations = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0);
  
  const variationsSelected = 
    (!product.colors || product.colors.length === 0 || selectedColor) &&
    (!product.sizes || product.sizes.length === 0 || selectedSize);
    
  const canAddToCart = !isSoldOut && (!hasVariations || variationsSelected);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart(product, { color: selectedColor, size: selectedSize }, isFlashSaleContext);
  }

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    setIsLoading(true);
    addToCart(product, { color: selectedColor, size: selectedSize }, isFlashSaleContext);
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
    <div className="space-y-4">
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-2">
            <Label className="font-semibold">Color</Label>
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                    <Label key={color} htmlFor={`color-${color}`}
                        className={cn(
                            "flex items-center justify-center rounded-md border-2 px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer",
                            selectedColor === color ? "border-primary ring-2 ring-primary" : "border-muted"
                        )}
                    >
                        <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                        {color}
                    </Label>
                ))}
            </RadioGroup>
        </div>
      )}

      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
            <Label className="font-semibold">Size</Label>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                    <Label key={size} htmlFor={`size-${size}`}
                        className={cn(
                            "flex items-center justify-center rounded-md border-2 px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer",
                            selectedSize === size ? "border-primary ring-2 ring-primary" : "border-muted"
                        )}
                    >
                        <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                        {size}
                    </Label>
                ))}
            </RadioGroup>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isLoading || !canAddToCart}>
          <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow} disabled={isLoading || !canAddToCart}>
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Processing..." : "Buy Now"}
        </Button>
      </div>
    </div>
  );
}
