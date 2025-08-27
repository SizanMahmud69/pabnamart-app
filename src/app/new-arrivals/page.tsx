
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export default function NewArrivalsPage() {
    const { products: allProducts } = useProducts();
    const newArrivals: Product[] = [...allProducts].sort((a, b) => b.id - a.id);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost" className="mb-4">
                       <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold text-center flex items-center justify-center gap-3">
                        <Sparkles className="h-10 w-10 text-primary" />
                        New Arrivals
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {newArrivals.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
