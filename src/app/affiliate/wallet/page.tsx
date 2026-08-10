
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect, useMemo, Suspense } from "react";
import { getFirestore, collection, query, where, onSnapshot, doc, getDocs, documentId, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning, Withdrawal, AffiliateSettings, Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, DollarSign, Hourglass, History, Send, Loader2, Clock, Undo2, Users, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { requestManualWithdrawal } from "@/app/affiliate/actions";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

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

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function AffiliateWalletPageContent() {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [orders, setOrders] = useState<Record<string, Order>>({});
    const [loading, setLoading] = useState(true);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings | null>(null);

    const { affiliateBalance, pendingEarnings, withdrawableBalance, pendingPayout } = useMemo(() => {
        const paidEarnings = earnings.filter(e => e.status === 'paid');
        const pendingTotal = earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0);

        let eligibleForWithdrawal = 0;
        let lockedAffiliateBalance = 0;
        const now = new Date();

        paidEarnings.forEach(earning => {
            const order = orders[earning.orderId];
            if (order && order.status === 'delivered' && order.deliveredAt) {
                const deliveryDate = new Date(order.deliveredAt);
                const withdrawalDeadline = new Date(deliveryDate.getTime() + 24 * 60 * 60 * 1000);

                if (now >= withdrawalDeadline) {
                    eligibleForWithdrawal += earning.commissionAmount;
                } else {
                    lockedAffiliateBalance += earning.commissionAmount;
                }
            } else {
                lockedAffiliateBalance += earning.commissionAmount;
            }
        });

        const totalPendingPayout = withdrawals
            .filter(w => w.status === 'pending')
            .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

        return {
            affiliateBalance: lockedAffiliateBalance,
            pendingEarnings: pendingTotal,
            withdrawableBalance: eligibleForWithdrawal,
            pendingPayout: totalPendingPayout
        };
    }, [earnings, orders, withdrawals]);

    const withdrawalScheduleText = useMemo(() => {
        if (!affiliateSettings) return '';

        const { withdrawalDay1, withdrawalDay2, minimumWithdrawal } = affiliateSettings;
        const minWithdrawalText = `Minimum ৳${minimumWithdrawal || 100} required.`;

        const day1Active = withdrawalDay1 > 0;
        const day2Active = withdrawalDay2 > 0;

        if (!day1Active && !day2Active) {
            return "Auto-withdrawals are disabled. Use the button below.";
        }
        
        const today = new Date().getDate();

        if (day1Active && day2Active) {
            if (today >= withdrawalDay2 && today < withdrawalDay1) {
                return `Auto-process on ${getOrdinal(withdrawalDay1)}. ${minWithdrawalText}`;
            } else {
                return `Auto-process on ${getOrdinal(withdrawalDay2)}. ${minWithdrawalText}`;
            }
        }

        if (day1Active) {
            return `Auto-process on ${getOrdinal(withdrawalDay1)}. ${minWithdrawalText}`;
        }

        if (day2Active) {
            return `Auto-process on ${getOrdinal(withdrawalDay2)}. ${minWithdrawalText}`;
        }

        return '';

    }, [affiliateSettings]);

    const transactionHistory = useMemo(() => {
        const history: any[] = [];

        earnings.forEach(earning => {
            if (earning.status === 'withdrawn') return;

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
            if (!user) setLoading(false);
            return;
        }

        if (appUser.affiliateStatus !== 'approved') {
            setLoading(false);
            return;
        }

        const settingsRef = doc(db, 'settings', 'affiliate');
        const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setAffiliateSettings(docSnap.data() as AffiliateSettings);
            } else {
                setAffiliateSettings({ withdrawalDay1: 16, withdrawalDay2: 1, minimumWithdrawal: 100 });
            }
        });

        const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid));
        const unsubEarnings = onSnapshot(earningsQuery, async (snapshot) => {
            const earningsData = snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning));
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

        // Removed orderBy to avoid index requirement for filtered query
        const withdrawalsQuery = query(collection(db, 'withdrawals'), where('affiliateUid', '==', user.uid));
        const unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
            setWithdrawals(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Withdrawal)));
        });

        setLoading(false);

        return () => {
            unsubEarnings();
            unsubWithdrawals();
            unsubSettings();
        }
    }, [user, appUser]);

    const handleManualWithdraw = async () => {
        if (!user || isWithdrawing) return;
        setIsWithdrawing(true);
        try {
            const result = await requestManualWithdrawal(user.uid);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading || !appUser) {
        return <LoadingSpinner />;
    }

    if (appUser.affiliateStatus === 'pending') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <Card className="max-w-lg w-full shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle>Request Pending</CardTitle>
                        <CardDescription>Your affiliate program application is under review.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">We will notify you once the review process is complete. Your wallet will be accessible then.</p>
                        <Button asChild className="mt-6" variant="outline">
                            <Link href="/">Back to Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (appUser.affiliateStatus === 'denied') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <Card className="max-w-lg w-full border-destructive shadow-lg">
                    <CardHeader className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="text-destructive mt-4">Request Denied</CardTitle>
                        <CardDescription>We're sorry, your affiliate application was not approved.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Please contact support if you have any questions.</p>
                        <Button asChild className="mt-6" variant="outline">
                            <Link href="/">Back to Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (appUser.affiliateStatus !== 'approved' || !appUser.affiliateId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <Card className="max-w-lg w-full shadow-lg border-primary/10">
                    <CardHeader className="text-center">
                        <Users className="mx-auto h-12 w-12 text-primary" />
                        <CardTitle className="text-3xl mt-2 font-black uppercase italic tracking-tighter">Join Program</CardTitle>
                        <CardDescription>Earn money by promoting our products.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">
                            Promote our products and earn a commission on every sale you refer. It's free to join!
                        </p>
                        <Button size="lg" asChild className="font-bold">
                            <Link href="/affiliate/join">Join Now for Free</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const minAmount = affiliateSettings?.minimumWithdrawal || 100;
    const canWithdraw = withdrawableBalance >= minAmount && !!appUser.payoutInfo;

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-black text-center flex items-center justify-center gap-3 uppercase italic tracking-tighter text-primary">
                   <Wallet className="h-8 w-8" />
                    My Wallet
                </h1>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Affiliate Balance</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black text-primary">৳{affiliateBalance.toFixed(2)}</div>
                        <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Commissions in 24h waiting period.</p>
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm border-orange-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Earnings</CardTitle>
                        <Hourglass className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black text-orange-600">৳{pendingEarnings.toFixed(2)}</div>
                         <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Orders waiting for delivery.</p>
                    </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50/30 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-700">Withdrawable</CardTitle>
                        <Send className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-blue-600">৳{withdrawableBalance.toFixed(2)}</div>
                            <p className="text-[9px] text-muted-foreground mt-1 font-medium">{withdrawalScheduleText}</p>
                        </div>
                        <Button 
                            className="w-full h-8 text-[10px] font-bold uppercase bg-blue-600 hover:bg-blue-700 shadow-sm" 
                            disabled={!canWithdraw || isWithdrawing}
                            onClick={handleManualWithdraw}
                        >
                            {isWithdrawing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Send className="h-3 w-3 mr-2" />}
                            Withdraw
                        </Button>
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm border-purple-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Payout</CardTitle>
                        <History className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xl sm:text-2xl font-black text-purple-600">৳{pendingPayout.toFixed(2)}</div>
                         <p className="text-[9px] text-muted-foreground mt-1 leading-tight">Currently in processing.</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5 text-primary" />Transaction History</CardTitle>
                    <CardDescription>A complete record of your earnings and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
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
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-md border border-transparent hover:border-primary/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border shadow-sm">
                                                <Icon className={cn("h-4 w-4", iconClass)} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm leading-none">{item.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">{item.description}</p>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <p className="text-[9px] text-muted-foreground font-medium">{item.date.toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-sm",
                                                item.isCredit ? "text-green-600" : "text-destructive"
                                            )}>
                                                {item.isCredit ? '+' : '-'}৳{item.amount.toFixed(2)}
                                            </p>
                                            <Badge variant={getUnifiedStatusBadgeVariant(item.status)} className="text-[8px] h-4 px-1.5 capitalize mt-1 font-bold">{item.status}</Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                        <div className="text-center py-16">
                            <History className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                            <p className="text-muted-foreground text-sm font-medium">No transaction history yet.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function AffiliateWalletPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AffiliateWalletPageContent />
        </Suspense>
    )
}
