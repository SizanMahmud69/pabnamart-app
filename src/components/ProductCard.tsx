
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Star, Truck, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  isFlashSaleContext?: boolean;
  size?: 'default' | 'small';
}

// Helper function to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

export default function ProductCard({ product, isFlashSaleContext = false, size = 'default' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [cardBgColor, setCardBgColor] = useState('hsl(var(--card))');

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = product.images[0];
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const [h, s] = rgbToHsl(r, g, b);
        // Using a high lightness value for a pastel/light background
        setCardBgColor(`hsl(${h}, ${s}%, 95%)`);
      }
    };
  }, [product.images]);


  const price = product.price;
  const originalPrice = product.originalPrice;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountAmount = hasDiscount ? originalPrice - price : 0;
  const isSoldOut = product.stock === 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      addToCart(product, isFlashSaleContext);
  }

  const productLink = isFlashSaleContext ? `/products/${product.id}?flash=true` : `/products/${product.id}`;
  
  const isSmall = size === 'small';

  const textShadowStyle = {
    textShadow: '0px 1px 3px rgba(255, 255, 255, 0.7)'
  };
  
  const dropShadowStyle = {
    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
  };


  return (
    <Card 
      className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg group"
      style={{ backgroundColor: cardBgColor, border: 'none' }}
    >
       <Link href={productLink} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              isSoldOut && "filter grayscale"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            data-ai-hint="product lifestyle"
          />
           {hasDiscount && !isSoldOut && discountAmount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              - ৳{discountAmount.toFixed(0)}
            </div>
          )}
          {isSoldOut && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white text-lg font-bold">Sold Out</span>
            </div>
          )}
           {product.freeShipping && !isSoldOut && !isSmall && (
            <div className="absolute bottom-2 left-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                <Truck className="h-3 w-3" />
                <span>Free Delivery</span>
            </div>
        )}
        </div>
      </Link>
      <CardContent className={cn("flex flex-col flex-grow space-y-2", isSmall ? "p-2" : "p-3")}>
        <p className="text-xs text-muted-foreground truncate" style={textShadowStyle}>{product.category}</p>
        <h3 
          className={cn(
              "font-semibold text-gray-800 leading-snug flex-grow h-10", 
              isSmall ? "text-xs h-8" : "text-sm h-10"
          )}
          style={textShadowStyle}
        >
            <Link href={productLink} className="hover:text-primary">
                <span className="truncate-2-lines">{product.name}</span>
            </Link>
        </h3>
        {isSmall ? (
             <div className="flex items-center justify-around text-xs text-muted-foreground" style={dropShadowStyle}>
                <div className="text-center">
                    <Star className="w-4 h-4 mx-auto fill-accent text-accent" />
                    <span style={textShadowStyle}>{product.rating.toFixed(1)}</span>
                </div>
                <div className="text-center">
                    <span className="font-semibold" style={textShadowStyle}>Sold</span>
                    <p style={textShadowStyle}>{product.sold || 0}</p>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground" style={dropShadowStyle}>
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span style={textShadowStyle}>{product.rating.toFixed(1)}</span>
                <span style={textShadowStyle}>|</span>
                <span style={textShadowStyle}>Sold {product.sold || 0}</span>
            </div>
        )}
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className={cn("font-bold text-primary", isSmall ? "text-base" : "text-lg")} style={dropShadowStyle}>৳{price}</p>
            {hasDiscount && (
              <p className={cn("text-muted-foreground line-through", isSmall ? "text-[10px]" : "text-xs")} style={dropShadowStyle}>
                ৳{originalPrice}
              </p>
            )}
          </div>
          {isSoldOut ? (
             <Button
                onClick={handleWishlistClick}
                size="icon"
                variant="outline"
                className={cn(isSmall ? "h-7 w-7" : "h-9 w-9")}
                disabled={isInWishlist(product.id)}
                aria-label={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
            >
                <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-destructive text-destructive")} />
            </Button>
          ) : (
            <Button
                onClick={handleAddToCart}
                size="icon"
                className={cn(isSmall ? "h-7 w-7" : "h-9 w-9")}
                aria-label="Add to Cart"
            >
                <ShoppingCart className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
