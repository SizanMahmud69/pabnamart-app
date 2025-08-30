
"use client";

import { useProducts } from '@/hooks/useProducts';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StarRating from '@/components/StarRating';
import AddToCartButton from './AddToCartButton';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useMemo, Suspense, use } from 'react';
import type { Product } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useParams, useSearchParams } from 'next/navigation';

function ProductDetailPageContent() {
  const params = useParams();
  // Using React.use() to unwrap params as per Next.js recommendation
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const { products, getFlashSalePrice } = useProducts();
  const [product, setProduct] = useState<Product | undefined | null>(null);

  const isFlashSaleContext = searchParams.get('flash') === 'true';
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [unwrappedParams.id]);

  useEffect(() => {
    const productId = unwrappedParams.id as string;
    if (products.length > 0 && productId) {
        const foundProduct = products.find(p => p.id === parseInt(productId));
        if (foundProduct) {
          if (isFlashSaleContext) {
            const flashPrice = getFlashSalePrice(foundProduct);
            // Create a temporary product view with flash sale price
            setProduct({
              ...foundProduct,
              originalPrice: foundProduct.originalPrice || foundProduct.price, // Use the real original price or the current price
              price: flashPrice,
            });
          } else {
            setProduct(foundProduct);
          }
        } else {
           setProduct(undefined);
        }
    }
  }, [products, unwrappedParams.id, isFlashSaleContext, getFlashSalePrice]);

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
  
  const hasDiscount = (product.originalPrice && product.originalPrice > product.price);
  const approvedReviews = product.reviews?.filter(r => r.status === 'approved') || [];

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
                
                <Card className="rounded-t-3xl -mt-6 md:mt-0 md:rounded-t-none md:rounded-b-lg relative z-10 shadow-lg">
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm font-bold text-primary uppercase tracking-wider">{product.category}</p>
                        <h1 className="text-2xl font-bold">{product.name}</h1>
                        <div className="flex items-center gap-2">
                            <StarRating rating={product.rating} />
                            <span className="text-muted-foreground text-sm">({approvedReviews.length} reviews)</span>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
                        
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-4xl font-bold text-primary">৳{product.price}</span>
                            {hasDiscount && (
                            <span className="text-2xl text-muted-foreground line-through">
                                ৳{product.originalPrice!}
                            </span>
                            )}
                        </div>
                        
                        <AddToCartButton product={product} isFlashSaleContext={isFlashSaleContext} />

                        <div className="flex items-center gap-2">
                            {product.stock > 0 ? (
                                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                                    In Stock ({product.stock} left)
                                </div>
                            ) : (
                                <div className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                                    Out of Stock
                                </div>
                            )}
                             {product.sold > 0 && (
                                <div className="inline-flex items-center justify-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                                    {product.sold} Sold
                                </div>
                            )}
                        </div>

                        <Separator className="my-4"/>

                        <div className="space-y-3 text-muted-foreground">
                            {product.freeShipping && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span>Eligible for free shipping</span>
                                </div>
                            )}
                            {product.shippingTime && (
                                <div className="flex items-center gap-3">
                                    <Truck className="h-5 w-5 text-blue-500" />
                                    <span>Ships in {product.shippingTime} business days</span>
                                </div>
                            )}
                            {product.returnPolicy && (
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-orange-500" />
                                    <span>{product.returnPolicy}-day return policy</span>
                                </div>
                            )}
                        </div>

                        {product.details && (
                            <>
                                <Separator className="my-4"/>
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Product Details</h2>
                                    <div className="prose prose-sm max-w-none text-muted-foreground">
                                        <p>{product.details}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator className="my-4"/>

                        <div>
                            <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
                            <div className="space-y-6">
                                {approvedReviews.length > 0 ? (
                                    approvedReviews.map((review) => (
                                        <div key={review.id} className="flex items-start gap-4">
                                            <Avatar>
                                                <AvatarFallback>{review.user.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold">{review.user.displayName}</p>
                                                    <StarRating rating={review.rating} />
                                                </div>
                                                <p className="text-muted-foreground mt-1">{review.comment}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{product.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-muted-foreground">This product has no reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}


export default function ProductDetailPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ProductDetailPageContent />
        </Suspense>
    );
}
