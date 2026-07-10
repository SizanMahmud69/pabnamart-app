
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo } from 'react';
import type { Product, Category } from '@/types';
import { useParams } from 'next/navigation';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

export default function CategoryPage() {
    const params = useParams();
    const { products: allProducts, loading: productsLoading } = useProducts();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'categories'), orderBy('createdAt', 'asc')), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
            setLoadingCats(false);
        });
        return () => unsubscribe();
    }, []);

    const currentCategory = useMemo(() => {
        const name = params.name as string;
        if (!name) return null;
        const decodedName = decodeURIComponent(name);
        return categories.find(c => c.name.toLowerCase() === decodedName.toLowerCase());
    }, [categories, params.name]);

    const products = useMemo(() => {
        if (!currentCategory) return [];
        
        // Find all sub-categories if this is a parent
        const subCategoryNames = categories
            .filter(c => c.parentId === currentCategory.id)
            .map(c => c.name.toLowerCase());
        
        const targetNames = [currentCategory.name.toLowerCase(), ...subCategoryNames];

        return allProducts.filter(p => targetNames.includes(p.category.toLowerCase()));
    }, [allProducts, currentCategory, categories]);

    const subCategories = useMemo(() => {
        if (!currentCategory) return [];
        return categories.filter(c => c.parentId === currentCategory.id);
    }, [categories, currentCategory]);

    if (productsLoading || loadingCats) return <LoadingSpinner />;

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button asChild variant="ghost" className="mb-4">
                       <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold">{currentCategory?.name || decodeURIComponent(params.name as string)}</h1>
                        {subCategories.length > 0 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {subCategories.map(sub => (
                                    <Button key={sub.id} asChild variant="outline" size="sm" className="rounded-full bg-white shadow-sm hover:bg-primary hover:text-white transition-all">
                                        <Link href={`/category/${encodeURIComponent(sub.name)}`}>
                                            {sub.name}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <h2 className="text-2xl font-semibold">No Products Found</h2>
                        <p className="text-muted-foreground mt-2">There are currently no products in this category.</p>
                        <Button asChild className="mt-6">
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
