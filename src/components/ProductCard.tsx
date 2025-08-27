
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product & { originalPrice?: number };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountAmount = hasDiscount ? product.originalPrice! - product.price : 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-lg group">
       <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            data-ai-hint="product lifestyle"
          />
           {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              - ৳{discountAmount.toFixed(0)}
            </div>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-col flex-grow p-3 space-y-2">
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-grow">
            <Link href={`/products/${product.id}`} className="hover:text-primary">
                {product.name}
            </Link>
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="w-4 h-4 fill-accent text-accent" />
          <span>{product.rating.toFixed(1)}</span>
          {product.reviews.length > 0 && <span>|</span>}
          {product.reviews.length > 0 && <span>Sold {product.reviews.length * 15}</span>}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className="text-lg font-bold text-primary">৳{product.price.toFixed(2)}</p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                ৳{product.originalPrice!.toFixed(2)}
              </p>
            )}
          </div>
          <Button
            onClick={() => addToCart(product)}
            size="icon"
            className="h-9 w-9"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
