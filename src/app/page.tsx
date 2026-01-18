
"use client";

import { useState, useEffect, Suspense, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Ticket, Sparkles, Star, Zap, Percent, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FlashSale from '@/components/FlashSale';
import AiRecommendations from '@/components/AiRecommendations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import Categories from '@/components/Categories';
import { useOffers } from '@/hooks/useOffers';
import { cn } from '@/lib/utils';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import Footer from '@/components/Footer';

const categoryImageMap: { [key: string]: { image: string; aiHint: string } } = {
  "Flash Sale": { image: "https://picsum.photos/seed/flashsale/800/600", aiHint: "flash sale" },
  "Electronics": { image: "https://picsum.photos/seed/electronics/800/600", aiHint: "electronics gadgets" },
  "Groceries": { image: "https://picsum.photos/seed/groceries/800/600", aiHint: "fresh food" },
  "Women's Fashion": { image: "https://picsum.photos/seed/fashion/800/600", aiHint: "stylish clothes" },
  "Men's Fashion": { image: "https://picsum.photos/seed/menfashion/800/600", aiHint: "men clothes" },
  "Cosmetics": { image: "https://picsum.photos/seed/cosmetics/800/600", aiHint: "makeup beauty" },
  "Mobile & Computers": { image: "https://picsum.photos/seed/computers/800/600", aiHint: "laptops mobile" },
  "default": { image: "https://picsum.photos/seed/sale/800/600", aiHint: "general sale" }
};

const defaultBanner = {
  title: "Welcome to PabnaMart",
  description: "Your one-stop shop for all your needs. Quality products, great prices.",
  backgroundImage: "https://picsum.photos/seed/welcome/800/600",
  link: "/products",
  aiHint: "shopping store",
  Icon: ShoppingBag,
  alignment: 'center'
};

const bannerLayouts = ['left', 'right'];

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { products: allProducts, getFlashSaleProducts, loading: productsLoading } = useProducts();
  const { activeOffers } = useOffers();

  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [visibleProductsCount, setVisibleProductsCount] = useState(9);
  const [isVoucherLoading, startVoucherTransition] = useTransition();


  useEffect(() => {
    if (allProducts.length > 0) {
      const sortedNew = [...allProducts].sort((a, b) => b.id - a.id);
      setNewArrivals(sortedNew.slice(0, 6));

      const sortedRated = [...allProducts].sort((a, b) => b.rating - a.rating);
      setTopRated(sortedRated.slice(0, 6));
      
      const { products: saleProducts } = getFlashSaleProducts();
      setFlashSaleProducts(saleProducts);
    }
  }, [allProducts, getFlashSaleProducts]);

  const heroBanners = useMemo(() => {
    let layoutIndex = 0;
    const getNextLayout = () => {
        const layout = bannerLayouts[layoutIndex % bannerLayouts.length];
        layoutIndex++;
        return layout;
    };
    
    const banners = activeOffers.map(offer => {
        const productsInCategory = allProducts.filter(p => p.category === offer.name);
        let randomProduct = null;
        if (productsInCategory.length > 0) {
            randomProduct = productsInCategory[Math.floor(Math.random() * productsInCategory.length)];
        }
        const categoryInfo = categoryImageMap[offer.name] || categoryImageMap.default;

        return {
            title: `${offer.discount}% Off on ${offer.name}`,
            description: `Get the best deals on our ${offer.name} collection.`,
            productImage: randomProduct?.images?.[0],
            backgroundImage: categoryInfo.image,
            link: `/category/${encodeURIComponent(offer.name)}`,
            aiHint: categoryInfo.aiHint,
            Icon: Percent,
            alignment: getNextLayout(),
        };
    });

    if (flashSaleProducts.length > 0) {
      const flashProductForBanner = flashSaleProducts[Math.floor(Math.random() * flashSaleProducts.length)];
      
      const flashSaleBanner = {
        title: "Flash Sale Live Now!",
        description: "Limited time offers. Grab them before they're gone!",
        productImage: flashProductForBanner?.images?.[0],
        backgroundImage: categoryImageMap["Flash Sale"].image,
        link: "/flash-sale",
        aiHint: categoryImageMap["Flash Sale"].aiHint,
        Icon: Zap,
        alignment: getNextLayout(),
      };
      banners.unshift(flashSaleBanner);
    }

    if (banners.length === 0) {
      const firstProduct = allProducts[0];
      return [{
        ...defaultBanner,
        productImage: firstProduct?.images?.[0],
        alignment: getNextLayout(),
      }];
    }

    return banners;
  }, [activeOffers, flashSaleProducts, allProducts]);
  
  const showRecommendations = searchQuery.trim().length > 0;
  
  const handleSeeMore = () => {
    setVisibleProductsCount(prevCount => prevCount + 9);
  };

  const handleVoucherClick = () => {
    startVoucherTransition(() => {
      router.push('/vouchers');
    });
  };

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
            {heroBanners.map((banner, index) => {
                const Icon = banner.Icon;
                
                return (
                  <CarouselItem key={index}>
                    <div className="relative bg-background rounded-lg overflow-hidden h-48 md:h-64 flex items-center justify-center">
                        {/* Background Image */}
                        <img 
                            src={banner.backgroundImage} 
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover" 
                            aria-hidden="true"
                            data-ai-hint={banner.aiHint}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

                        {/* Content Container */}
                        <div className={cn(
                            "relative w-full h-full flex items-center p-4 md:p-8",
                            banner.alignment === 'right' ? 'flex-row-reverse' : 'flex-row'
                        )}>
                            {/* Product Image */}
                            <div className="w-1/2 md:w-2/5 h-full flex items-center justify-center">
                                {banner.productImage ? (
                                    <img 
                                        src={banner.productImage} 
                                        alt={banner.title} 
                                        className="max-h-full max-w-full object-contain drop-shadow-lg"
                                    />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                      <ShoppingBag className="w-12 h-12 text-gray-300/50"/>
                                  </div>
                                )}
                            </div>

                            {/* Text Content */}
                            <div className="w-1/2 md:w-3/5 flex flex-col justify-center text-white px-4">
                                <h1 className="text-xl md:text-3xl font-bold mb-2">{banner.title}</h1>
                                <p className="text-sm md:text-base mb-4 hidden md:block">{banner.description}</p>
                                <Button asChild size="sm" className="w-fit bg-primary hover:bg-primary/90 h-8 md:h-10 md:px-6">
                                    <Link href={banner.link}>
                                        <Icon className="mr-2 h-4 w-4" />
                                        Shop Now
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                  </CarouselItem>
                )
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
        
        {/* Collect Vouchers Section */}
        <div onClick={handleVoucherClick} className="block hover:shadow-lg transition-shadow rounded-lg cursor-pointer">
          <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-0">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Ticket className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-bold text-lg">Collect Vouchers!</h2>
                  <p className="text-sm text-gray-600">Get extra savings on your next purchase.</p>
                </div>
              </div>
              {isVoucherLoading ? (
                <Loader2 className="h-6 w-6 text-gray-700 animate-spin" />
              ) : (
                <ArrowRight className="h-6 w-6 text-gray-700" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flash Sale Section */}
        <FlashSale products={flashSaleProducts} />

        {/* Categories Section */}
        <Categories />

        {/* New Arrivals Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="text-primary"/>New Arrivals</h2>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
                {productsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <CarouselItem key={i} className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <div className="p-1">
                           <ProductCardSkeleton />
                        </div>
                    </CarouselItem>
                  ))
                ) : (
                  <>
                    {newArrivals.map(product => (
                        <CarouselItem key={product.id} className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <div className="p-1">
                                <ProductCard product={product} />
                            </div>
                        </CarouselItem>
                    ))}
                    <CarouselItem className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <div className="p-1 flex h-full items-center justify-center">
                            <Button asChild variant="outline" className="h-full w-full">
                                <Link href="/new-arrivals" className="flex-col h-full">
                                    <span>See More</span>
                                    <ArrowRight className="mt-2 h-6 w-6" />
                                </Link>
                            </Button>
                        </div>
                    </CarouselItem>
                  </>
                )}
            </CarouselContent>
            <CarouselPrevious className="left-[-10px] sm:left-[-16px]" />
            <CarouselNext className="right-[-10px] sm:right-[-16px]" />
          </Carousel>
        </div>

         {/* Top Rated Products Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Star className="text-accent fill-accent" />Top Rated</h2>
          </div>
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                   {productsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <CarouselItem key={i} className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <div className="p-1">
                               <ProductCardSkeleton />
                            </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <>
                        {topRated.map(product => (
                            <CarouselItem key={product.id} className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                <div className="p-1">
                                    <ProductCard product={product} />
                                </div>
                            </CarouselItem>
                        ))}
                        <CarouselItem className="pl-2 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <div className="p-1 flex h-full items-center justify-center">
                                <Button asChild variant="outline" className="h-full w-full">
                                    <Link href="/top-rated" className="flex-col h-full">
                                        <span>See More</span>
                                        <ArrowRight className="mt-2 h-6 w-6" />
                                    </Link>
                                </Button>
                            </div>
                        </CarouselItem>
                      </>
                    )}
                </CarouselContent>
                <CarouselPrevious className="left-[-10px] sm:left-[-16px]" />
                <CarouselNext className="right-[-10px] sm:right-[-16px]" />
            </Carousel>
        </div>

        {/* All Products Section */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="text-primary"/>All Products</h2>
             <Link href="/products" className="text-primary font-semibold hover:underline">
                See All
            </Link>
          </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {productsLoading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <ProductCardSkeleton key={i} size="small" />
                ))
              ) : (
                allProducts.slice(0, visibleProductsCount).map(product => (
                  <ProductCard key={product.id} product={product} size="small" />
                ))
              )}
            </div>
            {!productsLoading && visibleProductsCount < allProducts.length && (
              <div className="mt-6 text-center">
                <Button onClick={handleSeeMore} variant="outline">
                  See More
                </Button>
              </div>
            )}
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

  const showRecommendations = searchQuery.trim().length > 0;

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
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <HomePageContent />
      </Suspense>
      <Footer />
    </>
  );
}
