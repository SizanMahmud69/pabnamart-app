
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
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import type { User as AppUser, AffiliateEarning } from "@/types";

const db = getFirestore(app);

function AffiliateHomePage() {
    const { user, appUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [referredUsers, setReferredUsers] = useState<AppUser[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
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

        // Fetch earnings to calculate total
        const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid));
        const unsubscribeEarnings = onSnapshot(earningsQuery, (snapshot) => {
            const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data() as AffiliateEarning).commissionAmount, 0);
            setTotalEarnings(total);
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
    
    // Affiliate Dashboard
    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Affiliate Dashboard</CardTitle>
                        <CardDescription>Track your performance and earnings.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <input id="affiliate-link" readOnly value={affiliateLink} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            <Button onClick={() => handleCopyToClipboard(affiliateLink)}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">৳{totalEarnings.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{referredUsers.length}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

}

export default withAuth(AffiliateHomePage);
