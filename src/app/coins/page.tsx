
"use client";

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, History, CalendarCheck, Loader2, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { CoinTransaction } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { dailyCheckInAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const db = getFirestore(app);

function CoinsPage() {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const q = query(
            collection(db, `users/${user.uid}/coinHistory`),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinTransaction));
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDailyCheckIn = async () => {
        if (!user) return;
        setIsCheckingIn(true);
        const result = await dailyCheckInAction(user.uid);
        if (result.success) {
            toast({ title: "Check-in Successful!", description: result.message });
        } else {
            toast({ title: "Info", description: result.message, variant: "default" });
        }
        setIsCheckingIn(false);
    };

    if (loading || !appUser) return <LoadingSpinner />;

    const coinBalance = appUser.coins || 0;
    const takaValue = (coinBalance / 10).toFixed(2);
    const today = new Date().toISOString().split('T')[0];
    const checkedInToday = appUser.lastCheckIn === today;

    return (
        <div className="bg-yellow-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Button asChild variant="ghost" className="mb-4">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>

                {/* Balance Card */}
                <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-xl border-0 mb-6">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-white/30">
                            <Coins className="h-10 w-10 text-yellow-100" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80 uppercase tracking-widest">My Coins</p>
                            <h1 className="text-6xl font-black">{coinBalance}</h1>
                        </div>
                        <div className="bg-black/10 px-4 py-2 rounded-full inline-block">
                            <p className="text-sm font-bold">≈ ৳{takaValue} Taka</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                            Daily Task
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-dashed border-primary/20">
                            <div>
                                <p className="font-bold">Daily Check-in</p>
                                <p className="text-xs text-muted-foreground">Come back every day to earn 1 coin!</p>
                            </div>
                            <Button 
                                onClick={handleDailyCheckIn} 
                                disabled={isCheckingIn || checkedInToday}
                                variant={checkedInToday ? "secondary" : "default"}
                            >
                                {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : (checkedInToday ? 'Collected' : 'Check-in')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Coin History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                tx.type === 'earn' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                            )}>
                                                {tx.type === 'earn' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{tx.reason}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className={cn(
                                            "font-bold text-sm",
                                            tx.type === 'earn' ? "text-green-600" : "text-red-600"
                                        )}>
                                            {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <History className="h-10 w-10 mx-auto mb-2" />
                                <p className="text-sm">No history yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(CoinsPage);
