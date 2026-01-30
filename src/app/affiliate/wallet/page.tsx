
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning, Withdrawal, AffiliateSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, DollarSign, AlertCircle, Users, Hourglass, Undo2, History } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const db = getFirestore(app);

function AffiliateWalletPageContent() {
    const { user, appUser } = useAuth();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status') as AffiliateEarning['status'] | null;
    const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);


    useEffect(() => {
        if (!user || !appUser || appUser.affiliateStatus !== 'approved') {
            setLoading(false);
            return;
        }

        let unsubEarnings: () => void;
        let unsubWithdrawals: () => void;
        let unsubSettings: () => void;

        const fetchData = () => {
            // Settings
            const settingsRef = doc(db, 'settings', 'affiliate');
            unsubSettings = onSnapshot(settingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    setAffiliateSettings(docSnap.data() as AffiliateSettings);
                } else {
                    setAffiliateSettings({ withdrawalDay1: 16, withdrawalDay2: 1 });
                }
            });

            // Earnings
            const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid));
            unsubEarnings = onSnapshot(earningsQuery, (snapshot) => {
                const earningsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning));
                earningsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setEarnings(earningsData);
            });

            // Withdrawals
            const withdrawalsQuery = query(collection(db, 'withdrawals'), where('affiliateUid', '==', user.uid), orderBy('requestedAt', 'desc'));
            unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
                setWithdrawals(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Withdrawal)));
                setLoading(false);
            });
        };

        fetchData();

        return () => {
            unsubEarnings?.();
            unsubWithdrawals?.();
            unsubSettings?.();
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
        withdrawnEarnings: earnings.filter(e => e.status === 'withdrawn').reduce((acc, e) => acc + e.commissionAmount, 0),
        reversedEarnings: earnings.filter(e => e.status === 'cancelled').reduce((acc, e) => acc + e.commissionAmount, 0),
    };
    
    const withdrawalScheduleText = useMemo(() => {
        if (!affiliateSettings) return '';

        const today = new Date().getDate();
        const { withdrawalDay1, withdrawalDay2 } = affiliateSettings;

        if (today >= withdrawalDay2 && today < withdrawalDay1) {
            return `Your available balance will be processed for withdrawal on the ${withdrawalDay1}th of this month.`;
        } else {
            return `Your available balance will be processed for withdrawal on the ${withdrawalDay2}st of next month.`;
        }

    }, [affiliateSettings]);


    const getStatusBadgeVariant = (status: AffiliateEarning['status']) => {
        switch (status) {
            case 'paid': return 'default';
            case 'pending': return 'secondary';
            case 'cancelled': return 'destructive';
            case 'withdrawn': return 'outline';
            default: return 'outline';
        }
    };
    
    const getWithdrawalStatusBadgeVariant = (status: Withdrawal['status']) => {
        switch (status) {
            case 'completed': return 'default';
            case 'pending': return 'secondary';
            case 'failed': return 'destructive';
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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">৳{stats.paidEarnings.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{withdrawalScheduleText}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                        <Hourglass className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">৳{stats.pendingEarnings.toFixed(2)}</div>
                         <p className="text-xs text-muted-foreground">From orders not yet delivered.</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Withdrawal History</CardTitle>
                </CardHeader>
                <CardContent>
                     {withdrawals.length > 0 ? (
                        <div className="space-y-2">
                            {withdrawals.map(withdrawal => (
                                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                    <div>
                                        <p className="font-semibold">Withdrawal to {withdrawal.payoutInfo.method}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                                            {withdrawal.transactionId && ` - TrxID: ${withdrawal.transactionId}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("font-bold", withdrawal.status === 'completed' && "text-green-600")}>
                                            ৳{withdrawal.amount.toFixed(2)}
                                        </p>
                                        <Badge variant={getWithdrawalStatusBadgeVariant(withdrawal.status)} className="capitalize mt-1">{withdrawal.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-4">No withdrawal history yet.</p>
                     )}
                </CardContent>
            </Card>


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
                                            earning.status === 'withdrawn' && "text-muted-foreground",
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
