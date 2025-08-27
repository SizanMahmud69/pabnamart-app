
import { products as allProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export default function TopRatedPage() {
    const topRatedProducts: Product[] = [...allProducts].sort((a, b) => b.rating - a.rating);

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
                       <Star className="h-10 w-10 text-accent fill-accent" />
                        Top Rated
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {topRatedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
