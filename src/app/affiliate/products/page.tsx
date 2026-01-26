
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMemo } from 'react';

export default function AffiliateProductsPage() {
    const { products: allProducts, loading } = useProducts();

    const affiliateProducts = useMemo(() => {
        return allProducts.filter(p => p.affiliateCommission && p.affiliateCommission > 0);
    }, [allProducts]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                       <DollarSign className="h-8 w-8 text-primary" />
                        Affiliate Products
                    </h1>
                    <p className="text-muted-foreground mt-2">Promote these products to earn a commission on each sale.</p>
                </div>
                
                {affiliateProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
