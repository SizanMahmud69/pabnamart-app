
"use client";

import { useAuth, withAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, DollarSign, BarChart2, Copy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { User as AppUser, AffiliateEarning } from "@/types";
import { Label } from "@/components/ui/label";

const db = getFirestore(app);

function AffiliatePage() {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [referredUsers, setReferredUsers] = useState<AppUser[]>([]);
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        if (!user || !appUser || appUser.affiliateStatus !== 'approved' || !appUser.affiliateId) return;

        // Fetch referred users
        const usersQuery = query(collection(db, 'users'), where('referredBy', '==', appUser.affiliateId));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            setReferredUsers(snapshot.docs.map(doc => doc.data() as AppUser));
        });

        // Fetch earnings
        const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribeEarnings = onSnapshot(earningsQuery, (snapshot) => {
            setEarnings(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning)));
        });

        return () => {
            unsubscribeUsers();
            unsubscribeEarnings();
        }
    }, [user, appUser]);

    const handleJoinProgram = () => {
        router.push('/affiliate/join');
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: "Referral link copied to clipboard." });
        });
    };

    const affiliateLink = appUser?.affiliateId ? `${baseUrl}/?ref=${appUser.affiliateId}` : '';
    
    const stats = {
        totalEarnings: earnings.reduce((acc, e) => acc + e.commissionAmount, 0),
        pendingEarnings: earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0),
        referralCount: referredUsers.length
    };


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
                            <Button asChild variant="ghost" className="mt-4">
                                <Link href="/account">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Account
                                </Link>
                            </Button>
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
                            <Button asChild variant="ghost" className="mt-4">
                                <Link href="/account">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Account
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (appUser.affiliateStatus !== 'approved') {
        return (
            <div className="bg-purple-50/30 min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        <Button asChild variant="ghost" className="mb-4">
                            <Link href="/account">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Account
                            </Link>
                        </Button>
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <DollarSign className="h-8 w-8 text-green-500" />
                                        <h3 className="font-semibold">Competitive Commissions</h3>
                                        <p className="text-sm text-muted-foreground">Earn a percentage on every sale you refer.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <BarChart2 className="h-8 w-8 text-blue-500" />
                                        <h3 className="font-semibold">Real-Time Tracking</h3>
                                        <p className="text-sm text-muted-foreground">Track your referrals and earnings in your dashboard.</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-8 w-8 text-purple-500" />
                                        <h3 className="font-semibold">Dedicated Support</h3>
                                        <p className="text-sm text-muted-foreground">Our affiliate team is here to help you succeed.</p>
                                    </div>
                                </div>
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
    
    // Affiliate Dashboard
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
                 <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Affiliate Dashboard</CardTitle>
                        <CardDescription>Track your performance and earnings.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <Label htmlFor="affiliate-link">Your Unique Referral Link</Label>
                        <div className="flex gap-2">
                            <input id="affiliate-link" readOnly value={affiliateLink} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            <Button onClick={() => handleCopyToClipboard(affiliateLink)}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>

                <Link href="/affiliate-offers" className="block">
                    <Card className="hover:bg-muted transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between">
                           <div>
                            <CardTitle>Browse Affiliate Products</CardTitle>
                            <CardDescription>Find products to promote and see their commission rates.</CardDescription>
                           </div>
                           <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </CardHeader>
                    </Card>
                </Link>
                
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
                            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">৳{stats.pendingEarnings.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{stats.referralCount}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Commission Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {earnings.length > 0 ? (
                            <div className="space-y-2">
                                {earnings.map(earning => (
                                    <div key={earning.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
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
                            <p className="text-muted-foreground text-center py-4">No earnings yet. Share your link to start earning!</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )

}

export default withAuth(AffiliatePage);
