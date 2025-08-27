
"use client";

import { useProducts } from '@/hooks/useProducts';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StarRating from '@/components/StarRating';
import AddToCartButton from './AddToCartButton';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { products } = useProducts();
  const [product, setProduct] = useState<Product | undefined | null>(null);
  
  useEffect(() => {
    const productId = params.id;
    if (products.length > 0 && productId) {
        const foundProduct = products.find(p => p.id === parseInt(productId));
        setProduct(foundProduct);
    }
  }, [products, params.id]);

  if (product === null) {
    return (
        <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Loading...</h1>
            </div>
        </div>
    )
  }

  if (!product) {
    return (
        <div className="bg-purple-50/30 min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Product not found</h1>
                <p className="text-muted-foreground mt-4">The product you are looking for does not exist.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
            <Carousel className="w-full">
                <CarouselContent>
                {product.images.map((img, index) => (
                    <CarouselItem key={index}>
                    <div className="aspect-square relative overflow-hidden rounded-lg">
                        <Image
                        src={img}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        data-ai-hint="product image"
                        />
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </Carousel>
            </div>
            
            <div>
            <Card>
                <CardHeader>
                <p className="text-sm font-medium text-primary">{product.category}</p>
                <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                <div className="flex items-center gap-4 pt-2">
                    <StarRating rating={product.rating} className="text-lg" />
                    <span className="text-muted-foreground">{product.rating.toFixed(1)} ({product.reviews.length} reviews)</span>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-3xl font-bold text-primary mb-4">৳{product.price.toFixed(2)}</p>
                <CardDescription className="text-base leading-relaxed">{product.description}</CardDescription>
                <div className="mt-6">
                    <AddToCartButton product={product} />
                </div>
                </CardContent>
            </Card>
            </div>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
            <Card>
            <CardContent className="p-6">
                {product.reviews.length > 0 ? (
                <div className="space-y-6">
                    {product.reviews.map((review, index) => (
                    <div key={index}>
                        <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{review.user}</p>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                        {index < product.reviews.length - 1 && <Separator className="mt-6" />}
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-muted-foreground">No reviews yet.</p>
                )}
            </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}
