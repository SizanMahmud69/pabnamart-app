
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, Gift } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';

const db = getFirestore(app);

export default function B1G1Page() {
    const { products: allProducts, loading: productsLoading } = useProducts();
    const [isActive, setIsActive] = useState<boolean | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'offerPages'), (docSnap) => {
            if (docSnap.exists()) {
                setIsActive(docSnap.data().b1g1 ?? true);
            } else {
                setIsActive(true);
            }
        });
        return () => unsub();
    }, []);

    if (isActive === null || productsLoading) return <LoadingSpinner />;

    if (!isActive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                    <Gift className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Offer Coming Soon!</h1>
                <p className="text-muted-foreground max-w-md">Our Buy One Get One offer is currently inactive. Stay tuned for the next campaign!</p>
                <Button asChild className="mt-8">
                    <Link href="/">Back to Shopping</Link>
                </Button>
            </div>
        );
    }

    const b1g1Products = allProducts.filter(p => p.isB1G1 === true);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 p-8 bg-gradient-to-r from-primary to-purple-600 rounded-2xl shadow-xl text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Gift className="h-32 w-32 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <Button asChild variant="ghost" className="mb-4 text-white hover:bg-white/20">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tighter">Buy 1 Get 1 Free!</h1>
                        <p className="text-purple-100 max-w-md mx-auto">Double the happiness with every purchase. Limited time only!</p>
                    </div>
                </div>

                {b1g1Products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {b1g1Products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
                        <h2 className="text-2xl font-bold">No Products in this Offer</h2>
                        <p className="text-muted-foreground mt-2">Currently no products are tagged for B1G1. Check again later!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
