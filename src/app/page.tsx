
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Ticket, Sparkles, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FlashSale from '@/components/FlashSale';
import AiRecommendations from '@/components/AiRecommendations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import Categories from '@/components/Categories';

const heroBanners = [
  {
    title: "Mega Electronics Sale",
    description: "Up to 40% off on the latest gadgets and electronics.",
    image: "https://picsum.photos/seed/electronics/1200/400",
    link: "/category/Electronics",
    aiHint: "electronics gadgets"
  },
  {
    title: "Fresh Groceries Daily",
    description: "Get the best quality groceries delivered to your door.",
    image: "https://picsum.photos/seed/groceries/1200/400",
    link: "/category/Groceries",
    aiHint: "fresh food"
  },
  {
    title: "New Fashion Arrivals",
    description: "Check out the latest trends in our apparel section.",
    image: "https://picsum.photos/seed/fashion/1200/400",
    link: "/category/Women's Fashion",
    aiHint: "stylish clothes"
  }
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { products: allProducts } = useProducts();

  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);


  useEffect(() => {
    if (allProducts.length > 0) {
      // New arrivals: sort by ID descending (assuming higher ID is newer)
      const sortedNew = [...allProducts].sort((a, b) => b.id - a.id);
      setNewArrivals(sortedNew.slice(0, 5));

      // Top rated: sort by rating descending
      const sortedRated = [...allProducts].sort((a, b) => b.rating - a.rating);
      setTopRated(sortedRated.slice(0, 5));

      // Flash sale products with mock discount
      const saleProducts = allProducts.slice(-2).map(p => ({
        ...p,
        originalPrice: p.originalPrice || p.price + 50,
      }));
      setFlashSaleProducts(saleProducts);
    }
  }, [allProducts]);
  
  const showRecommendations = searchQuery.trim().length > 0;

  if (searchQuery) {
    return <Suspense fallback={<div>Loading...</div>}><SearchPageContent searchQuery={searchQuery} /></Suspense>;
  }


  return (
    <div className="bg-purple-50/30 min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <Carousel
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
          opts={{ loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {heroBanners.map((banner, index) => (
              <CarouselItem key={index}>
                 <div className="relative text-white rounded-lg overflow-hidden">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      width={1200}
                      height={400}
                      className="object-cover w-full h-48 md:h-64"
                      data-ai-hint={banner.aiHint}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center p-6">
                      <h1 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h1>
                      <p className="text-lg md:text-xl mb-4">{banner.description}</p>
                      <Button asChild className="w-fit bg-primary hover:bg-primary/90">
                        <Link href={banner.link}>
                          <ShoppingBag className="mr-2 h-5 w-5" />
                          Shop Now
                        </Link>
                      </Button>
                    </div>
                  </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        
        {/* Collect Vouchers Section */}
        <Link href="/vouchers" className="block hover:shadow-lg transition-shadow rounded-lg">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Ticket className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-bold text-lg">Collect Vouchers!</h2>
                  <p className="text-sm text-gray-600">Get extra savings on your next purchase.</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-700" />
            </CardContent>
          </Card>
        </Link>

        {/* Flash Sale Section */}
        <FlashSale products={flashSaleProducts} />

        {/* Categories Section */}
        <Categories />

        {/* New Arrivals Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-primary"/>New Arrivals</h2>
            <Link href="/new-arrivals" className="text-primary font-semibold hover:underline">
                See More
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
        </div>

         {/* Top Rated Products Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Star className="text-accent fill-accent" />Top Rated</h2>
             <Link href="/top-rated" className="text-primary font-semibold hover:underline">
                See More
            </Link>
          </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {topRated.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function SearchPageContent({ searchQuery }: { searchQuery: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { products: allProducts } = useProducts();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filteredProducts);
      setIsLoading(false);
    }, 500);
  }, [searchQuery, allProducts]);

  return (
     <div className="bg-purple-50/30 min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <AiRecommendations searchQuery={searchQuery} currentProducts={products} />
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{`Results for "${searchQuery}"`}</h2>
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
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
             <div className="text-center py-10">
              <p className="text-lg text-gray-600">No products found for "{searchQuery}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
