"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import { products as allProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import AiRecommendations from '@/components/AiRecommendations';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching products
    setTimeout(() => {
      setProducts(allProducts);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(product =>
        category === 'all' ? true : product.category === category
      )
      .filter(
        product => product.price >= priceRange[0] && product.price <= priceRange[1]
      )
      .filter(product => product.rating >= rating);
  }, [products, searchQuery, category, priceRange, rating]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(allProducts.map(p => p.category)))], []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <ProductFilters
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            rating={rating}
            onRatingChange={setRating}
          />
        </aside>

        <main className="lg:col-span-3">
          <div className="mb-8">
            <AiRecommendations 
              searchQuery={searchQuery}
              currentProducts={filteredProducts}
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
                  <h3 className="text-xl font-bold tracking-tight">No products found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
