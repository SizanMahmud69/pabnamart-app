
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

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
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Product not found</h1>
                <p className="text-muted-foreground mt-4">The product you are looking for does not exist.</p>
            </div>
        </div>
    );
  }
  
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="bg-background min-h-screen">
        <div className="container mx-auto px-0 md:px-4 md:py-8">
            <div className="max-w-2xl mx-auto">
                <div className="md:hidden sticky top-0 bg-background/80 backdrop-blur-sm z-10 p-2">
                     <Button asChild variant="ghost" size="icon">
                        <Link href="/">
                            <ArrowLeft />
                        </Link>
                    </Button>
                </div>
                <Carousel className="w-full md:rounded-lg md:overflow-hidden group">
                    <CarouselContent>
                    {product.images.map((img, index) => (
                        <CarouselItem key={index}>
                        <div className="aspect-square relative bg-muted">
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
                    <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Carousel>
                
                <div className="bg-purple-50/30 p-6 md:rounded-b-lg">
                    <p className="text-sm font-bold text-primary uppercase tracking-wider">{product.category}</p>
                    <h1 className="text-4xl font-bold my-2">{product.name}</h1>
                    <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={product.rating} />
                        <span className="text-muted-foreground text-sm">({product.rating.toFixed(1)} stars)</span>
                    </div>
                    <CardDescription className="text-base leading-relaxed">{product.description}</CardDescription>
                </div>

                 <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                             <p className="text-sm text-muted-foreground">Price</p>
                             <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-primary">৳{product.price.toFixed(2)}</span>
                                {hasDiscount && (
                                <span className="text-lg text-muted-foreground line-through">
                                    ৳{product.originalPrice!.toFixed(2)}
                                </span>
                                )}
                            </div>
                        </div>
                        <AddToCartButton product={product} />
                    </div>
                 </div>

                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Customer Reviews ({product.reviews.length})</h2>
                    <div className="space-y-6">
                        {product.reviews.length > 0 ? (
                            product.reviews.map((review, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{review.user}</p>
                                        </div>
                                        <p className="text-muted-foreground mt-1">{review.comment}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground">No reviews yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
