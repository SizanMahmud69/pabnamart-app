"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { products as allProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FlashSale from '@/components/FlashSale';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const flashSaleProducts = allProducts.slice(0, 4);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching products
    setTimeout(() => {
      setProducts(allProducts);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="relative text-white rounded-lg overflow-hidden">
          <Image
            src="https://picsum.photos/seed/electronics/1200/400"
            alt="Electronics Sale"
            width={1200}
            height={400}
            className="object-cover w-full h-48 md:h-64"
            data-ai-hint="electronics gadgets"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center p-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mega Electronics Sale</h1>
            <p className="text-lg md:text-xl mb-4">Up to 40% off on the latest gadgets and electronics.</p>
            <Button asChild className="w-fit bg-primary hover:bg-primary/90">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Collect Vouchers Section */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Ticket className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-bold text-lg">Collect Vouchers!</h2>
                <p className="text-sm text-gray-600">Get extra savings on your next purchase.</p>
              </div>
            </div>
            <Link href="/vouchers">
              <ArrowRight className="h-6 w-6 text-gray-700" />
            </Link>
          </CardContent>
        </Card>

        {/* Flash Sale Section */}
        <FlashSale products={flashSaleProducts} />

        {/* All Products Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">All Products</h2>
            <Link href="/products" className="text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>
          {isLoading ? (
             <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-2">
                    <div className="aspect-square bg-gray-200 rounded-md animate-pulse" />
                    <div className="mt-2 h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="mt-1 h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
