
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
                {product.colors.map(color => {
                    const isOutOfStock = color.stock <= 0;
                    return (
                        <Label key={color.name} htmlFor={`color-${color.name}`}
                            className={cn(
                                "flex items-center justify-center rounded-md border-2 px-3 py-2 text-sm font-medium",
                                isOutOfStock 
                                    ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                                    : "hover:bg-accent cursor-pointer",
                                selectedColor === color.name && !isOutOfStock && "border-primary ring-2 ring-primary"
                            )}
                        >
                            <RadioGroupItem value={color.name} id={`color-${color.name}`} className="sr-only" disabled={isOutOfStock} />
                            <span className={cn(isOutOfStock && "line-through")}>{color.name}</span>
                            {isOutOfStock ? 
                                <span className="text-xs text-destructive ml-2">(Out of Stock)</span> :
                                <span className="text-xs text-muted-foreground ml-2">({color.stock})</span>
                            }
                        </Label>
                    )
                })}
            </RadioGroup>
        </div>
      )}

      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
            <Label className="font-semibold">Size</Label>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {product.sizes.map(size => {
                    const isOutOfStock = size.stock <= 0;
                    return (
                        <Label key={size.name} htmlFor={`size-${size.name}`}
                           className={cn(
                                "flex items-center justify-center rounded-md border-2 px-3 py-2 text-sm font-medium",
                                isOutOfStock 
                                    ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                                    : "hover:bg-accent cursor-pointer",
                                selectedSize === size.name && !isOutOfStock && "border-primary ring-2 ring-primary"
                            )}
                        >
                            <RadioGroupItem value={size.name} id={`size-${size.name}`} className="sr-only" disabled={isOutOfStock} />
                            <span className={cn(isOutOfStock && "line-through")}>{size.name}</span>
                             {isOutOfStock ? 
                                <span className="text-xs text-destructive ml-2">(Out of Stock)</span> :
                                <span className="text-xs text-muted-foreground ml-2">({size.stock})</span>
                            }
                        </Label>
                    )
                })}
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
