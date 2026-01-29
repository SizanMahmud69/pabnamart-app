"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, DollarSign, AlertCircle, Users } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const db = getFirestore(app);

function AffiliateWalletPage() {
    const { user, appUser } = useAuth();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
        totalEarnings: earnings.reduce((acc, e) => acc + e.commissionAmount, 0),
        pendingEarnings: earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0),
        paidEarnings: earnings.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.commissionAmount, 0),
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
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{stats.totalEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">৳{stats.paidEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">৳{stats.pendingEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Commission History</CardTitle>
                    <CardDescription>A list of all your commission earnings.</CardDescription>
                </CardHeader>
                <CardContent>
                     {earnings.length > 0 ? (
                        <div className="space-y-2">
                            {earnings.map(earning => (
                                <div key={earning.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                    <div>
                                        <p className="font-semibold">{earning.productName}</p>
                                        <p className="text-xs text-muted-foreground">Order: #{earning.orderNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+ ৳{earning.commissionAmount.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{earning.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-8">No earnings history found.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
export default withAuth(AffiliateWalletPage);
