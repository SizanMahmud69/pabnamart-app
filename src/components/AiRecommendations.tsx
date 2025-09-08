
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductRecommendations } from '@/app/actions';
import { useProducts } from '@/hooks/useProducts';
import Image from 'next/image';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import type { Product } from '@/types';

interface AiRecommendationsProps {
  searchQuery: string;
  currentProducts: Product[];
}

export default function AiRecommendations({ searchQuery, currentProducts }: AiRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { products: allProducts } = useProducts();

  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setRecommendations([]);
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const productCatalog = allProducts.map(p => `${p.name}: ${p.description}`).join('\n');
        const result = await getProductRecommendations({
          browsingHistory: searchQuery,
          productCatalog: productCatalog,
        });

        if (result && result.recommendations) {
          const recommendedProducts = result.recommendations
            .map(recName =>
              allProducts.find(p => p.name.toLowerCase() === recName.toLowerCase())
            )
            .filter((p): p is Product => p !== undefined);
            
          // Filter out products that are already in the main filtered view
          const uniqueRecommendations = recommendedProducts.filter(rec => 
            !currentProducts.some(p => p.id === rec.id)
          );

          setRecommendations(uniqueRecommendations);
        } else {
          setRecommendations([]);
        }
      } catch (e) {
        console.error("Failed to get AI recommendations:", e);
        setError("Could not fetch recommendations at this time.");
        setRecommendations([]);
      }
    });
  }, [searchQuery, currentProducts, allProducts]);

  if (isPending) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="text-accent" /> AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Skeleton className="h-32 w-32 rounded-lg" />
          <Skeleton className="h-32 w-32 rounded-lg" />
          <Skeleton className="h-32 w-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }
  
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lightbulb className="text-accent" /> AI Recommendations for "{searchQuery}"</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent>
            {recommendations.map(product => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Link href={`/products/${product.id}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="100px"
                            className="object-cover"
                            data-ai-hint="product image"
                            unoptimized
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-primary">৳{product.price.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
}
