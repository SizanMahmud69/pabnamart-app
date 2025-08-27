
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import type { Product } from '@/types';
import { products as allProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { useSearchParams } from 'next/navigation';
import AiRecommendations from '@/components/AiRecommendations';

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const allCategories = useMemo(() => ['All', ...Array.from(new Set(allProducts.map(p => p.category)))], []);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    let filtered = allProducts;

    // Filter by search query first
    if (searchQuery) {
       filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Then apply other filters
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    filtered = filtered.filter(
      p => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (rating > 0) {
      filtered = filtered.filter(p => p.rating >= rating);
    }

    // Simulate loading
    setTimeout(() => {
        setProducts(filtered);
        setIsLoading(false);
    }, 300);

  }, [selectedCategory, priceRange, rating, searchQuery]);
  
  const showRecommendations = searchQuery.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <ProductFilters
            categories={allCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            rating={rating}
            onRatingChange={setRating}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {showRecommendations && <AiRecommendations searchQuery={searchQuery} currentProducts={products} />}
            
            <h1 className="text-3xl font-bold">
              {searchQuery ? `Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'All Products' : selectedCategory)}
            </h1>
            
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className="space-y-2">
                      <div className="aspect-square bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
              </div>
            ) : products.length > 0 ? (
               <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-gray-600">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductsPageContent />
    </Suspense>
  )
}
