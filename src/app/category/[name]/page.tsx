
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { useParams } from 'next/navigation';

export default function CategoryPage() {
    const params = useParams();
    const { products: allProducts } = useProducts();
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        const name = params.name as string;
        if (name) {
            const decodedName = decodeURIComponent(name);
            setCategoryName(decodedName);
            const filteredProducts = allProducts.filter(p => p.category.toLowerCase() === decodedName.toLowerCase());
            setProducts(filteredProducts);
        }
    }, [params.name, allProducts]);

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
                    <h1 className="text-4xl font-bold text-center">{categoryName}</h1>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold">No Products Found</h2>
                        <p className="text-muted-foreground mt-2">There are currently no products in the "{categoryName}" category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
