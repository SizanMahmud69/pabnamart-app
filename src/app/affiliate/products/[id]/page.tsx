
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useAuth, withAuth } from '@/hooks/useAuth';
import type { Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Share2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

function AffiliateProductPage() {
    const params = useParams();
    const router = useRouter();
    const { products } = useProducts();
    const { appUser } = useAuth();
    const { toast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        const productId = params.id as string;
        if (products.length > 0 && productId) {
            const foundProduct = products.find(p => p.id === parseInt(productId));
            if (foundProduct) {
                setProduct(foundProduct);
            }
            setLoading(false);
        }
    }, [products, params.id]);

    const shareUrl = useMemo(() => {
        if (!product || !appUser?.affiliateId) return '';
        return `${baseUrl}/products/${product.id}?ref=${appUser.affiliateId}`;
    }, [product, baseUrl, appUser]);

    const commissionAmount = useMemo(() => {
        if (!product || !product.affiliateCommission) return 0;
        return (product.price * product.affiliateCommission) / 100;
    }, [product]);

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl).then(() => {
            toast({ title: "Referral Link Copied!" });
        }).catch(err => {
            toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!product) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>Product not found.</p>
                <Button asChild variant="link">
                    <Link href="/affiliate">Back to Affiliate Home</Link>
                </Button>
            </div>
        );
    }
    
    if (!product.affiliateCommission || product.affiliateCommission <= 0) {
        return (
             <div className="container mx-auto p-4 text-center">
                <p>This product is not part of the affiliate program.</p>
                <Button asChild variant="link">
                    <Link href="/affiliate">Back to Affiliate Home</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-md px-4 py-6">
                <header className="py-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/affiliate">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Affiliate Home
                        </Link>
                    </Button>
                </header>

                <main className="space-y-6">
                    <Card>
                        <CardHeader className="p-0 border-b">
                             <div className="relative w-full overflow-hidden bg-muted aspect-square">
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                             <h2 className="text-xl font-bold">{product.name}</h2>
                             <p className="text-2xl font-bold text-primary mt-2">৳{product.price}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-primary flex items-center gap-2">
                                <DollarSign className="h-6 w-6" />
                                Your Commission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-lg">
                                Earn a <span className="font-bold text-2xl text-primary">{product.affiliateCommission}%</span> commission
                            </p>
                            <p className="text-3xl font-extrabold text-primary mt-2">
                                ৳{commissionAmount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">on each sale from your referral link.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               <Share2 className="h-5 w-5" />
                                Share Your Link
                            </CardTitle>
                            <CardDescription>Copy your unique referral link and share it to start earning.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Input value={shareUrl} readOnly />
                                <Button size="icon" onClick={copyToClipboard} disabled={!shareUrl}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}

export default withAuth(AffiliateProductPage);
