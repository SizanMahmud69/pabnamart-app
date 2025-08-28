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

interface ProductCardProps {
  product: Product;
  isFlashSaleContext?: boolean;
}

export default function ProductCard({ product, isFlashSaleContext = false }: ProductCardProps) {
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

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-lg group">
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
           {product.freeShipping && !isSoldOut && (
            <div className="absolute bottom-2 left-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                <Truck className="h-3 w-3" />
                <span>Free Delivery</span>
            </div>
        )}
        </div>
      </Link>
      <CardContent className="flex flex-col flex-grow p-3 space-y-2">
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-grow">
            <Link href={productLink} className="hover:text-primary">
                {product.name}
            </Link>
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span>{product.rating.toFixed(1)}</span>
          <span>|</span>
          <span>Sold {product.sold || 0}</span>
        </div>
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className="text-lg font-bold text-primary">৳{price.toFixed(2)}</p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                ৳{originalPrice.toFixed(2)}
              </p>
            )}
          </div>
          {isSoldOut ? (
             <Button
                onClick={handleWishlistClick}
                size="icon"
                variant="outline"
                className="h-9 w-9"
                disabled={isInWishlist(product.id)}
                aria-label={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
            >
                <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-destructive text-destructive")} />
            </Button>
          ) : (
            <Button
                onClick={handleAddToCart}
                size="icon"
                className="h-9 w-9"
                aria-label="Add to Cart"
            >
                <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
