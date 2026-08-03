
"use client";

import { useState, useEffect, Suspense, useMemo, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product, Banner } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Ticket, Sparkles, Star, Zap, Percent, Loader2, CarouselNext, CarouselPrevious } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import FlashSale from '@/components/FlashSale';
import AiRecommendations from '@/components/AiRecommendations';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi, CarouselPrevious as CarouselPrev, CarouselNext as CarouselNxt } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import Categories from '@/components/Categories';
import { useOffers } from '@/hooks/useOffers';
import { cn } from '@/lib/utils';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import Footer from '@/components/Footer';
import { useVouchers } from '@/hooks/useVouchers';
import { Badge } from '@/components/ui/badge';
import FloatingCoin from '@/components/FloatingCoin';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

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
  const { hasUncollectedVouchers } = useVouchers();

  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [visibleProductsCount, setVisibleProductsCount] = useState(9);
  const [isVoucherLoading, startVoucherTransition] = useTransition();
  const [customBanners, setCustomBanners] = useState<Banner[]>([]);

  // Carousel dots state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    // Fetch custom banners from Firestore
    const bannersRef = collection(db, 'banners');
    const q = query(bannersRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setCustomBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
    });
    return () => unsubscribe();
  }, []);

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
    
    const now = new Date();
    let banners: any[] = [];

    // 1. Add Active Custom Admin Banners
    const activeCustom = customBanners
        .filter(cb => !cb.isFixed && (!cb.expiresAt || new Date(cb.expiresAt) > now))
        .map(cb => ({
            title: cb.title,
            backgroundImage: cb.imageUrl,
            link: cb.link || '/products',
            aiHint: 'offer banner',
            alignment: getNextLayout(),
        }));
    
    banners.push(...activeCustom);

    // 2. Add Automatic Offer Banners
    activeOffers.forEach(offer => {
        const productsInCategory = allProducts.filter(p => p.category === offer.name);
        let randomProduct = null;
        if (productsInCategory.length > 0) {
            randomProduct = productsInCategory[Math.floor(Math.random() * productsInCategory.length)];
        }
        const categoryInfo = categoryImageMap[offer.name] || categoryImageMap.default;

        banners.push({
            title: `${offer.discount}% Off on ${offer.name}`,
            backgroundImage: categoryInfo.image,
            link: `/category/${encodeURIComponent(offer.name)}`,
            aiHint: categoryInfo.aiHint,
            alignment: getNextLayout(),
        });
    });

    // 3. Add Flash Sale Banner
    if (flashSaleProducts.length > 0) {
      banners.unshift({
        title: "Flash Sale Live Now!",
        backgroundImage: categoryImageMap["Flash Sale"].image,
        link: "/flash-sale",
        aiHint: categoryImageMap["Flash Sale"].aiHint,
        alignment: getNextLayout(),
      });
    }

    // 4. FALLBACK: If no active promotional banners exist, use FIXED banners
    if (banners.length === 0) {
      const fixedBanners = customBanners
        .filter(cb => cb.isFixed)
        .map(cb => ({
            title: cb.title,
            backgroundImage: cb.imageUrl,
            link: cb.link || '/products',
            aiHint: 'fixed banner',
            alignment: getNextLayout(),
        }));

      if (fixedBanners.length > 0) {
        banners = fixedBanners;
      } else {
        // Absolute fallback to a default system banner
        banners = [{
          ...defaultBanner,
          alignment: getNextLayout(),
        }];
      }
    }

    return banners;
  }, [customBanners, activeOffers, flashSaleProducts, allProducts]);
  
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
      <FloatingCoin />
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
            <Carousel
                setApi={setApi}
                plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
                opts={{ loop: true }}
                className="w-full"
            >
                <CarouselContent>
                    {heroBanners.map((banner, index) => {
                        return (
                        <CarouselItem key={index}>
                            <Link href={banner.link} className="block group">
                                <div className="relative bg-background rounded-lg overflow-hidden h-48 md:h-64 flex items-center justify-center">
                                    {/* Background Image */}
                                    <img 
                                        src={banner.backgroundImage} 
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                        aria-hidden="true"
                                        data-ai-hint={banner.aiHint}
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
                                </div>
                            </Link>
                        </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
            
            {/* Pagination Dots - Improved Visibility */}
            {heroBanners.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 pb-2">
                    {heroBanners.map((_, i) => (
                        <button
                            key={i}
                            className={cn(
                                "h-2.5 rounded-full transition-all duration-300 shadow-sm border border-primary/10",
                                current === i 
                                    ? "bg-primary w-8" 
                                    : "bg-primary/20 w-2.5 hover:bg-primary/40"
                            )}
                            onClick={() => api?.scrollTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
        
        {/* Collect Vouchers Section */}
        <div onClick={handleVoucherClick} className="block hover:shadow-lg transition-all rounded-lg cursor-pointer group relative">
          {hasUncollectedVouchers && (
            <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-white px-3 py-1 shadow-lg border-2 border-white flex items-center">
              {"New Voucher!".split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block animate-wave"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </Badge>
          )}
          <Card className={cn(
              "bg-gradient-to-r from-purple-100 to-pink-100 border-0 transition-all",
              hasUncollectedVouchers && "ring-2 ring-primary ring-offset-2"
          )}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-full">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Collect Vouchers!</h2>
                  <p className="text-sm text-gray-600">Get extra savings on your next purchase.</p>
                </div>
              </div>
              {isVoucherLoading ? (
                <Loader2 className="h-6 w-6 text-gray-700 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                   {hasUncollectedVouchers && <span className="text-xs font-bold text-primary animate-pulse hidden sm:inline">Claim Now</span>}
                   <ArrowRight className="h-6 w-6 text-gray-700 transition-transform group-hover:translate-x-1" />
                </div>
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
            <CarouselPrev className="left-[-10px] sm:left-[-16px]" />
            <CarouselNxt className="right-[-10px] sm:right-[-16px]" />
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
                <CarouselPrev className="left-[-10px] sm:left-[-16px]" />
                <CarouselNxt className="right-[-10px] sm:right-[-16px]" />
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
