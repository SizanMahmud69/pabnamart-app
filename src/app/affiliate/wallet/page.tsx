
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, collection, query, where, onSnapshot, doc, getDocs, documentId, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning, Withdrawal, AffiliateSettings, Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, DollarSign, AlertCircle, Users, Hourglass, Undo2, History } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const db = getFirestore(app);

const getUnifiedStatusBadgeVariant = (status: AffiliateEarning['status'] | Withdrawal['status']) => {
    switch (status) {
        case 'paid':
        case 'completed':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'cancelled':
        case 'failed':
            return 'destructive';
        case 'withdrawn':
            return 'outline';
        default:
            return 'outline';
    }
};

function AffiliateWalletPageContent() {
    const { user, appUser } = useAuth();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [orders, setOrders] = useState<Record<string, Order>>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);

    const { affiliateBalance, pendingEarnings, estimatedNextWithdrawal } = useMemo(() => {
        const paid = earnings.filter(e => e.status === 'paid');
        const pending = earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0);

        const totalAffiliateBalance = paid.reduce((acc, e) => acc + e.commissionAmount, 0);
        
        let eligibleForWithdrawal = 0;
        const now = new Date();

        paid.forEach(earning => {
            const order = orders[earning.orderId];
            if (order && order.status === 'delivered' && order.deliveredAt) {
                const maxReturnDays = Math.max(0, ...order.items.map(item => item.returnPolicy || 0));
                 if (maxReturnDays > 0) {
                    const deliveryDate = new Date(order.deliveredAt);
                    const returnDeadline = new Date(deliveryDate);
                    returnDeadline.setDate(deliveryDate.getDate() + maxReturnDays);

                    if (now > returnDeadline) {
                        eligibleForWithdrawal += earning.commissionAmount;
                    }
                } else {
                    eligibleForWithdrawal += earning.commissionAmount;
                }
            }
        });

        return {
            affiliateBalance: totalAffiliateBalance,
            pendingEarnings: pending,
            estimatedNextWithdrawal: eligibleForWithdrawal,
        };
    }, [earnings, orders]);

    const withdrawalScheduleText = useMemo(() => {
        if (!affiliateSettings) return '';

        const { withdrawalDay1, withdrawalDay2, minimumWithdrawal } = affiliateSettings;
        const minWithdrawalText = `A minimum of ৳${minimumWithdrawal || 100} is required for withdrawal.`;

        const day1Active = withdrawalDay1 > 0;
        const day2Active = withdrawalDay2 > 0;

        if (!day1Active && !day2Active) {
            return "Automatic withdrawals are currently disabled.";
        }
        
        const today = new Date().getDate();

        if (day1Active && day2Active) {
            if (today >= withdrawalDay2 && today < withdrawalDay1) {
                return `Earnings will be processed on the ${withdrawalDay1}th of this month. ${minWithdrawalText}`;
            } else {
                return `Earnings will be processed on the ${withdrawalDay2}st of next month. ${minWithdrawalText}`;
            }
        }

        if (day1Active) {
            return `Withdrawals are processed once a month on the ${withdrawalDay1}th. ${minWithdrawalText}`;
        }

        if (day2Active) {
            return `Withdrawals are processed once a month on the ${withdrawalDay2}st. ${minWithdrawalText}`;
        }

        return '';

    }, [affiliateSettings]);

    const transactionHistory = useMemo(() => {
        const history: any[] = [];

        earnings.forEach(earning => {
            if (earning.status === 'withdrawn') {
                return;
            }

            let type: 'earning' | 'reversal' = 'earning';
            let isCredit = true;
            let title = `Commission: ${earning.productName}`;

            if (earning.status === 'cancelled') {
                type = 'reversal';
                isCredit = false;
                title = `Reversal: ${earning.productName}`;
            }

            history.push({
                id: `earn-${earning.id}`,
                date: new Date(earning.createdAt),
                type: type,
                title: title,
                description: `Order #${earning.orderNumber}`,
                amount: earning.commissionAmount,
                status: earning.status,
                isCredit: isCredit,
            });
        });

        withdrawals.forEach(withdrawal => {
            history.push({
                id: `wd-${withdrawal.id}`,
                date: new Date(withdrawal.requestedAt),
                type: 'withdrawal',
                title: `Withdrawal to ${withdrawal.payoutInfo.method}`,
                description: withdrawal.transactionId ? `TrxID: ${withdrawal.transactionId}` : `Acc: ${withdrawal.payoutInfo.accountNumber}`,
                amount: withdrawal.amount,
                status: withdrawal.status,
                isCredit: false,
            });
        });

        return history.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [earnings, withdrawals]);

    useEffect(() => {
        if (!user || !appUser) {
            setLoading(false);
            return;
        }

        if (appUser.affiliateStatus !== 'approved') {
            setLoading(false);
            return;
        }

        let unsubSettings: (() => void) | undefined;
        let unsubEarnings: (() => void) | undefined;
        let unsubWithdrawals: (() => void) | undefined;

        const fetchData = () => {
            const settingsRef = doc(db, 'settings', 'affiliate');
            unsubSettings = onSnapshot(settingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    setAffiliateSettings(docSnap.data() as AffiliateSettings);
                } else {
                    setAffiliateSettings({ withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 });
                }
            });

            const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid));
            unsubEarnings = onSnapshot(earningsQuery, async (snapshot) => {
                const earningsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning));
                earningsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setEarnings(earningsData);

                const orderIds = [...new Set(earningsData.map(e => e.orderId))];
                if (orderIds.length > 0) {
                    const fetchedOrders: Record<string, Order> = {};
                    const chunkSize = 30;
                    for (let i = 0; i < orderIds.length; i += chunkSize) {
                        const chunk = orderIds.slice(i, i + chunkSize);
                        if (chunk.length > 0) {
                            const ordersQuery = query(collection(db, 'orders'), where(documentId(), 'in', chunk));
                            const ordersSnapshot = await getDocs(ordersQuery);
                            ordersSnapshot.forEach(orderDoc => {
                                fetchedOrders[orderDoc.id] = { id: orderDoc.id, ...orderDoc.data() } as Order;
                            });
                        }
                    }
                    setOrders(prevOrders => ({...prevOrders, ...fetchedOrders}));
                }
            });

            const withdrawalsQuery = query(collection(db, 'withdrawals'), where('affiliateUid', '==', user.uid), orderBy('requestedAt', 'desc'));
            unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
                setWithdrawals(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Withdrawal)));
            });
        };
        
        fetchData();
        setLoading(false);


        return () => {
            unsubEarnings?.();
            unsubWithdrawals?.();
            unsubSettings?.();
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
                        <CardTitle className="text-sm font-medium">Affiliate Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">৳{affiliateBalance.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Your total earned commission from delivered orders.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                        <Hourglass className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">৳{pendingEarnings.toFixed(2)}</div>
                         <p className="text-xs text-muted-foreground">From orders not yet delivered.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Next Withdrawal</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">৳{estimatedNextWithdrawal.toFixed(2)}</div>
                         <p className="text-xs text-muted-foreground">{withdrawalScheduleText}</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Transaction History</CardTitle>
                    <CardDescription>A complete record of your earnings and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent>
                     {transactionHistory.length > 0 ? (
                        <div className="space-y-2">
                            {transactionHistory.map(item => {
                                let Icon = DollarSign;
                                let iconClass = "text-green-500";
                                if (item.type === 'withdrawal') {
                                    Icon = Wallet;
                                    iconClass = "text-blue-500";
                                } else if (item.type === 'reversal') {
                                    Icon = Undo2;
                                    iconClass = "text-red-500";
                                } else if (item.status === 'pending') {
                                    Icon = Hourglass;
                                    iconClass = "text-orange-500";
                                }

                                return (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background">
                                                <Icon className={cn("h-5 w-5", iconClass)} />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                                <p className="text-xs text-muted-foreground">{item.date.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-bold",
                                                item.isCredit ? "text-green-600" : "text-destructive"
                                            )}>
                                                {item.isCredit ? '+' : '-'}৳{item.amount.toFixed(2)}
                                            </p>
                                            <Badge variant={getUnifiedStatusBadgeVariant(item.status)} className="capitalize mt-1">{item.status}</Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-8">No transaction history yet.</p>
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
