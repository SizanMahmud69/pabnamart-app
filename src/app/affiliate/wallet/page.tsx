
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, DollarSign, AlertCircle, Users, Hourglass, Undo2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const db = getFirestore(app);

function AffiliateWalletPageContent() {
    const { user, appUser } = useAuth();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status') as AffiliateEarning['status'] | null;


    useEffect(() => {
        if (!user || !appUser || appUser.affiliateStatus !== 'approved') {
            setLoading(false);
            return;
        }

        const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribeEarnings = onSnapshot(earningsQuery, (snapshot) => {
            setEarnings(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching earnings: ", error);
            setLoading(false);
        });

        return () => {
            unsubscribeEarnings();
        }
    }, [user, appUser]);

    const handleJoinProgram = () => {
        router.push('/affiliate/join');
    };

    const filteredEarnings = useMemo(() => {
        if (!statusFilter) {
            return earnings;
        }
        return earnings.filter(e => e.status === statusFilter);
    }, [earnings, statusFilter]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!appUser) {
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

    const stats = {
        paidEarnings: earnings.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.commissionAmount, 0),
        pendingEarnings: earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0),
        reversedEarnings: earnings.filter(e => e.status === 'cancelled').reduce((acc, e) => acc + e.commissionAmount, 0),
    };

    const getStatusBadgeVariant = (status: AffiliateEarning['status']) => {
        switch (status) {
            case 'paid': return 'default';
            case 'pending': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                   <Wallet className="h-8 w-8 text-primary" />
                    My Wallet
                </h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">৳{stats.paidEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                        <Hourglass className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">৳{stats.pendingEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reversed Earnings</CardTitle>
                        <Undo2 className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">৳{stats.reversedEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Commission History</CardTitle>
                    <CardDescription>A list of all your commission earnings.</CardDescription>
                </CardHeader>
                <CardContent>
                     {filteredEarnings.length > 0 ? (
                        <div className="space-y-2">
                            {filteredEarnings.map(earning => (
                                <div key={earning.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                    <div>
                                        <p className="font-semibold">{earning.productName}</p>
                                        <p className="text-xs text-muted-foreground">Order: #{earning.orderNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "font-bold",
                                            earning.status === 'paid' && "text-green-600",
                                            earning.status === 'pending' && "text-orange-600",
                                            earning.status === 'cancelled' && "text-destructive line-through",
                                        )}>
                                            {earning.status === 'cancelled' ? '- ' : '+ '}৳{earning.commissionAmount.toFixed(2)}
                                        </p>
                                        <Badge variant={getStatusBadgeVariant(earning.status)} className="capitalize mt-1">{earning.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-8">No earnings history found for this status.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}

function AffiliateWalletPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AffiliateWalletPageContent />
        </Suspense>
    )
}

export default withAuth(AffiliateWalletPage);
