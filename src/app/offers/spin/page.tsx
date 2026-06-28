
"use client";

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles, Trophy, Coins, Clock, Ban } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const db = getFirestore(app);

const PRIZES = [
    { label: '1% Extra', value: 1, color: '#8b5cf6' },
    { label: '2% Extra', value: 2, color: '#ec4899' },
    { label: 'Try Again', value: 0, color: '#94a3b8' },
    { label: '5% Extra', value: 5, color: '#f59e0b' },
    { label: '3% Extra', value: 3, color: '#10b981' },
    { label: '1.5% Extra', value: 1.5, color: '#3b82f6' },
    { label: 'No Luck', value: 0, color: '#64748b' },
    { label: '10% MEGA', value: 10, color: '#ef4444' },
];

function SpinWinPage() {
    const { user, appUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isActive, setIsActive] = useState<boolean | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
    const [hasSpunToday, setHasSpunToday] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const unsubStatus = onSnapshot(doc(db, 'settings', 'offerPages'), (docSnap) => {
            if (docSnap.exists()) {
                setIsActive(docSnap.data().spin ?? true);
            } else {
                setIsActive(true);
            }
        });
        return () => unsubStatus();
    }, []);

    useEffect(() => {
        if (appUser) {
            const today = new Date().toISOString().split('T')[0];
            setHasSpunToday(appUser.lastSpinDate === today);
            
            // Timer logic for active discount
            if (appUser.spinDiscountExpiry) {
                const expiry = new Date(appUser.spinDiscountExpiry).getTime();
                const interval = setInterval(() => {
                    const now = new Date().getTime();
                    const diff = expiry - now;
                    if (diff <= 0) {
                        setTimeLeft(null);
                        clearInterval(interval);
                    } else {
                        setTimeLeft(Math.floor(diff / 1000));
                    }
                }, 1000);
                return () => clearInterval(interval);
            }
        }
    }, [appUser]);

    if (isActive === null) return <LoadingSpinner />;

    if (!isActive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                    <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Coming Soon!</h1>
                <p className="text-muted-foreground max-w-md">Our Spin & Win lucky draw is currently resting. Check back soon for a chance to win big!</p>
                <Button asChild className="mt-8">
                    <Link href="/">Back to Shopping</Link>
                </Button>
            </div>
        );
    }

    const handleSpin = async () => {
        if (!user || isSpinning || hasSpunToday) return;

        setIsSpinning(true);
        setResult(null);

        const extraSpins = 5; 
        const randomSector = Math.floor(Math.random() * PRIZES.length);
        const sectorDegrees = 360 / PRIZES.length;
        const targetRotation = rotation + (360 * extraSpins) + (randomSector * sectorDegrees) + (360 - (rotation % 360));
        
        setRotation(targetRotation);

        setTimeout(async () => {
            const prizeIndex = (PRIZES.length - Math.floor((targetRotation % 360) / sectorDegrees)) % PRIZES.length;
            const finalPrize = PRIZES[prizeIndex];
            setResult(finalPrize);
            setIsSpinning(false);

            const today = new Date().toISOString().split('T')[0];
            const expiryTime = new Date(Date.now() + 5 * 60000).toISOString(); // 5 minutes from now
            
            try {
                const updateData: any = { lastSpinDate: today };
                
                if (finalPrize.value > 0) {
                    updateData.activeSpinDiscount = finalPrize.value;
                    updateData.spinDiscountExpiry = expiryTime;
                    
                    toast({
                        title: "Congratulations!",
                        description: `You won ${finalPrize.label} Extra Discount! It's valid for only 5 minutes.`,
                    });
                } else {
                    toast({
                        title: "Better luck next time!",
                        description: "You didn't win any discount this time.",
                    });
                }
                
                await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
                setHasSpunToday(true);
            } catch (e) {
                console.error(e);
            }
        }, 4000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-slate-950 min-h-screen text-white overflow-hidden flex flex-col">
            <header className="p-4 border-b border-white/10 flex items-center justify-between">
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Main
                    </Link>
                </Button>
                {timeLeft !== null && (
                    <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50">
                        <Clock className="h-4 w-4 text-red-500 animate-pulse" />
                        <span className="font-mono font-bold text-red-500">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Lucky Spin</h1>
                    <p className="text-gray-400 text-sm">Spin once every day to win <span className="text-white font-bold">Extra Discount!</span></p>
                </div>

                <div className="relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900">
                             <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-slate-900 mt-2" />
                        </div>
                    </div>

                    <div 
                        className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(139,92,246,0.3)] relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {PRIZES.map((prize, i) => {
                                const angle = (360 / PRIZES.length);
                                const rotationAngle = i * angle;
                                return (
                                    <g key={i} transform={`rotate(${rotationAngle}, 50, 50)`}>
                                        <path 
                                            d={`M 50,50 L 50,0 A 50,50 0 0,1 ${50 + 50 * Math.sin(angle * Math.PI / 180)},${50 - 50 * Math.cos(angle * Math.PI / 180)} Z`} 
                                            fill={prize.color} 
                                        />
                                        <text 
                                            x="50" y="20" 
                                            fill="white" 
                                            fontSize="3.5" 
                                            fontWeight="bold" 
                                            textAnchor="middle" 
                                            transform={`rotate(${angle/2}, 50, 50)`}
                                        >
                                            {prize.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-inner flex items-center justify-center border-4 border-slate-900">
                             <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    {hasSpunToday ? (
                        <div className="flex flex-col items-center gap-3 bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                            <Ban className="h-10 w-10 text-red-400 opacity-50" />
                            <div>
                                <h3 className="font-bold text-lg">Already Spun Today!</h3>
                                <p className="text-xs text-gray-500 mt-1">You've already tried your luck for today. Come back tomorrow!</p>
                            </div>
                            {timeLeft !== null && (
                                <Button asChild className="w-full mt-2 bg-red-600 hover:bg-red-700">
                                    <Link href="/cart">Use Discount Now ({formatTime(timeLeft)})</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Button 
                            onClick={handleSpin} 
                            disabled={isSpinning} 
                            className="w-full h-14 text-xl font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl shadow-purple-900/20 active:scale-95 transition-transform"
                        >
                            {isSpinning ? <Loader2 className="h-6 w-6 animate-spin" /> : "Spin Now!"}
                        </Button>
                    )}

                    {result && !isSpinning && (
                        <Card className="bg-white/10 border-white/20 animate-in zoom-in-95 fade-in duration-500">
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                                {result.value > 0 ? (
                                    <>
                                        <Trophy className="h-8 w-8 text-yellow-400" />
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">You Won</p>
                                            <p className="text-2xl font-black text-yellow-400">{result.label}</p>
                                            <p className="text-[10px] text-red-400 font-bold mt-1 uppercase">Hurry! Valid for 5 minutes only.</p>
                                        </div>
                                        <Button asChild className="w-full bg-yellow-500 text-slate-900 hover:bg-yellow-600 font-bold">
                                            <Link href="/cart">Shop Now</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <p className="font-bold text-gray-300">Try again tomorrow! 🍀</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withAuth(SpinWinPage);
