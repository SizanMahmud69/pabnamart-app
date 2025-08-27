"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-lg">
       <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square w-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            data-ai-hint="product lifestyle"
          />
        </div>
      </Link>
      <CardContent className="flex-grow p-3">
        <h3 className="text-sm font-semibold text-gray-800 truncate">
            <Link href={`/products/${product.id}`} className="hover:text-primary">
                {product.name}
            </Link>
        </h3>
        <p className="text-lg font-bold text-primary mt-1">৳{product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-2 pt-0">
        <Button
          onClick={() => addToCart(product)}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
