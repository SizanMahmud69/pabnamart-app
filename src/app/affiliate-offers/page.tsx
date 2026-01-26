
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo } from 'react';

export default function AffiliateOffersPage() {
    const { products: allProducts, loading } = useProducts();

    const affiliateProducts = useMemo(() => {
        return allProducts.filter(p => p.affiliateCommission && p.affiliateCommission > 0);
    }, [allProducts]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost" className="mb-4">
                       <Link href="/affiliate">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Affiliate Program
                        </Link>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-center flex items-center justify-center gap-3">
                           <DollarSign className="h-10 w-10 text-primary" />
                            Affiliate Products
                        </h1>
                        <p className="text-muted-foreground mt-2">Promote these products to earn a commission on each sale.</p>
                    </div>
                </div>
                
                {affiliateProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {affiliateProducts.map(product => (
                            <ProductCard key={product.id} product={product} showCommission={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold">No Affiliate Products Found</h2>
                        <p className="text-muted-foreground mt-2">There are currently no products in the affiliate program.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
