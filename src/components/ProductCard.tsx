"use client";

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

export default function ProductCard({ product, isFlashSaleContext = false, size = 'default' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  
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

  const defaultImage = "https://i.ibb.co/gV28rC7/default-image.jpg";
  let imageUrl = product.images?.[0] || defaultImage;

  // Basic check for a valid URL to prevent errors if the src is invalid
  try {
    if (imageUrl) new URL(imageUrl);
  } catch (e) {
    imageUrl = defaultImage;
  }

  return (
    <Card 
      className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg group"
    >
       <Link href={productLink} className="block">
        <div className="relative w-full overflow-hidden bg-muted aspect-square">
          <img
            src={imageUrl}
            alt={product.name}
            className={cn(
              "object-cover w-full h-full transition-transform duration-300 group-hover:scale-105",
              isSoldOut && "filter grayscale"
            )}
            data-ai-hint="product lifestyle"
            loading="lazy"
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
        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
        <h3 
          className={cn(
              "font-semibold text-gray-800 leading-snug flex-grow", 
              isSmall ? "text-xs h-8" : "text-sm h-10"
          )}
        >
            <Link href={productLink} className="hover:text-primary">
                <span className="truncate-2-lines">{product.name}</span>
            </Link>
        </h3>
        {isSmall ? (
             <div className="flex items-center justify-around text-xs text-muted-foreground">
                <div className="text-center flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span>{product.rating.toFixed(1)}</span>
                </div>
                <div className="text-center">
                    <span className="font-semibold">Sold</span>
                    <p>{product.sold || 0}</p>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span>{product.rating.toFixed(1)}</span>
                <span>|</span>
                <span>Sold {product.sold || 0}</span>
            </div>
        )}
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className={cn("font-bold text-primary", isSmall ? "text-base" : "text-lg")}>৳{price}</p>
            {hasDiscount && (
              <p className={cn("text-muted-foreground line-through", isSmall ? "text-[10px]" : "text-xs")}>
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
