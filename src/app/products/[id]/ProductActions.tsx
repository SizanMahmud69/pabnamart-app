
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import type { Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, Heart, Loader2, Zap, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

const aggregateVariants = (variants: ProductVariant[] | undefined): ProductVariant[] => {
    if (!variants) return [];
    const variantsMap = new Map<string, number>();

    variants.forEach(variant => {
        if (variant.name) {
            const existingKey = Array.from(variantsMap.keys()).find(k => k.toLowerCase() === variant.name.toLowerCase());
            const keyToUse = existingKey || variant.name;
            variantsMap.set(keyToUse, (variantsMap.get(keyToUse) || 0) + variant.stock);
        }
    });

    return Array.from(variantsMap.entries()).map(([name, stock]) => ({ name, stock }));
};


export default function ProductActions({ 
    product, 
    isFlashSaleContext = false,
    isB1G1Context = false
}: { 
    product: Product, 
    isFlashSaleContext?: boolean,
    isB1G1Context?: boolean
}) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const isDecimalUnit = ['KG', 'Meter', 'Litre'].includes(product.unit || '');
  const minQuantity = isDecimalUnit ? 0.250 : 1;

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(minQuantity);
  
  useEffect(() => {
    setQuantity(minQuantity);
  }, [minQuantity]);

  const uniqueColors = useMemo(() => aggregateVariants(product.colors), [product.colors]);
  const uniqueSizes = useMemo(() => aggregateVariants(product.sizes), [product.sizes]);

  const isSoldOut = product.stock === 0;
  const hasVariations = (uniqueColors.length > 0) || (uniqueSizes.length > 0);
  
  const variationsSelected = 
    (uniqueColors.length === 0 || selectedColor) &&
    (uniqueSizes.length === 0 || selectedSize);
    
  const canAddToCart = !isSoldOut && (!hasVariations || variationsSelected) && quantity >= minQuantity;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addToCart(product, { color: selectedColor, size: selectedSize }, isFlashSaleContext, isB1G1Context, quantity);
  }

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    setIsLoading(true);
    addToCart(product, { color: selectedColor, size: selectedSize }, isFlashSaleContext, isB1G1Context, quantity);
    router.push('/checkout');
  }
  
  const handleQuickOrder = () => {
    if (!canAddToCart) return;
    const quickOrderData = {
        product,
        variations: { color: selectedColor, size: selectedSize },
        quantity,
        isFlashSaleContext,
        isB1G1Context
    };
    sessionStorage.setItem('quickOrderData', JSON.stringify(quickOrderData));
    router.push('/quick-order');
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
    <div id="variations" className="space-y-4 pt-2">
      {uniqueColors.length > 0 && (
        <div className="space-y-2">
            <Label className="font-semibold">Color</Label>
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                {uniqueColors.map(color => {
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

      {uniqueSizes.length > 0 && (
        <div className="space-y-2">
            <Label className="font-semibold">Size</Label>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {uniqueSizes.map(size => {
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

      <div className="space-y-2">
        <Label className="font-semibold">Quantity ({product.unit || 'Pcs'})</Label>
        <div className="flex items-center gap-3">
             <div className="flex items-center border rounded-md h-10 overflow-hidden bg-background">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-full w-10 rounded-none border-r"
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
                        setQuantity(val < minQuantity ? minQuantity : val);
                    }}
                    onBlur={() => {
                        if (quantity < minQuantity) setQuantity(minQuantity);
                    }}
                    className="w-20 border-0 text-center h-full focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-full w-10 rounded-none border-l"
                    onClick={() => setQuantity(prev => isDecimalUnit ? prev + 0.1 : prev + 1)}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            {isDecimalUnit && <span className="text-xs text-muted-foreground font-medium">পয়েন্ট হিসেবেও লিখতে পারেন (যেমন: ০.৫০০)</span>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 pt-2">
          <Button size="lg" className="w-full h-12" onClick={handleAddToCart} disabled={isLoading || !canAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
          </Button>
          <Button size="lg" variant="outline" className="w-full h-12" onClick={handleBuyNow} disabled={isLoading || !canAddToCart}>
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Processing..." : "Buy Now"}
          </Button>
        </div>
        
        {!user && (
          <Button 
            size="lg" 
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg uppercase tracking-tight shadow-lg transition-transform active:scale-95" 
            onClick={handleQuickOrder} 
            disabled={isLoading || !canAddToCart}
          >
            <Zap className="mr-2 h-6 w-6 fill-white" />
            কন্টিনিউ শপিং
          </Button>
        )}
      </div>
    </div>
  );
}
