"use client";

import { useAuth, withAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AlertCircle, Package, Users } from "lucide-react";
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { useMemo } from 'react';

function AffiliateHomePage() {
    const { appUser } = useAuth();
    const router = useRouter();
    
    const { products: allProducts, loading: productsLoading } = useProducts();

    const affiliateProducts = useMemo(() => {
        return allProducts.filter(p => p.affiliateCommission && p.affiliateCommission > 0);
    }, [allProducts]);

    const handleJoinProgram = () => {
        router.push('/affiliate/join');
    };

    if (!appUser || productsLoading) {
        return <LoadingSpinner />;
    }

    if (appUser.affiliateStatus === 'pending') {
        return (
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto px-4 py-8 text-center max-w-lg">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Pending</CardTitle>
                            <CardDescription>Your affiliate program application is under review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>We will notify you once the review process is complete. Thank you for your patience.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (appUser.affiliateStatus === 'denied') {
        return (
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto px-4 py-8 text-center max-w-lg">
                    <Card className="border-destructive">
                        <CardHeader className="text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                            <CardTitle className="text-destructive mt-4">Request Denied</CardTitle>
                            <CardDescription>We're sorry, your affiliate application was not approved.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Please contact support if you have any questions.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (appUser.affiliateStatus !== 'approved' || !appUser.affiliateId) {
        return (
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <Card>
                            <CardHeader className="text-center">
                                <Users className="mx-auto h-12 w-12 text-primary" />
                                <CardTitle className="text-3xl mt-2">Join Our Affiliate Program</CardTitle>
                                <CardDescription>Earn money by promoting our products.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground mb-6">
                                    Promote our products and earn a commission on every sale you refer. It's free to join!
                                </p>
                                <Button size="lg" onClick={handleJoinProgram}>
                                    Join Now for Free
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }
    
    // Affiliate Home: Products List
    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                       <Package className="h-8 w-8 text-primary" />
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
    )

}

export default withAuth(AffiliateHomePage);
