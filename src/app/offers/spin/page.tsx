
"use client";

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles, Trophy, Coins, Clock, Ban } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Banner } from '@/types';

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
    const [banner, setBanner] = useState<Banner | null>(null);
    const [loadingBanner, setLoadingBanner] = useState(true);

    useEffect(() => {
        const unsubStatus = onSnapshot(doc(db, 'settings', 'offerPages'), (docSnap) => {
            if (docSnap.exists()) {
                setIsActive(docSnap.data().spin ?? true);
            } else {
                setIsActive(true);
            }
        });

        // Fetch custom banner for this page
        // Removed orderBy to avoid index requirement
        const bannersRef = collection(db, 'banners');
        const q = query(
            bannersRef, 
            where('link', '==', '/offers/spin')
        );
        
        const unsubBanner = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Manually sort to get the latest one
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
                data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                const now = new Date();
                const latestValid = data.find(b => !b.expiresAt || new Date(b.expiresAt) > now);
                setBanner(latestValid || null);
            } else {
                setBanner(null);
            }
            setLoadingBanner(false);
        });

        return () => {
            unsubStatus();
            unsubBanner();
        };
    }, []);

    useEffect(() => {
        if (appUser) {
            const today = new Date().toISOString().split('T')[0];
            setHasSpunToday(appUser.lastSpinDate === today);
            
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

    if (isActive === null || loadingBanner) return <LoadingSpinner />;

    if (!isActive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center text-white bg-slate-950">
                <div className="bg-primary/10 p-6 rounded-full mb-6 ring-1 ring-primary/20">
                    <Sparkles className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Offer Coming Soon!</h1>
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

        const minFullSpins = 7;
        const randomSector = Math.floor(Math.random() * PRIZES.length);
        const sectorDegrees = 360 / PRIZES.length;
        const targetRotation = rotation + (360 * minFullSpins) + (randomSector * sectorDegrees);
        
        setRotation(targetRotation);

        setTimeout(async () => {
            const normalizedRotation = targetRotation % 360;
            const prizeIndex = (PRIZES.length - Math.floor(normalizedRotation / sectorDegrees)) % PRIZES.length;
            const finalPrize = PRIZES[prizeIndex];
            
            setResult(finalPrize);
            setIsSpinning(false);

            const today = new Date().toISOString().split('T')[0];
            const expiryTime = new Date(Date.now() + 5 * 60000).toISOString(); 
            
            try {
                const updateData: any = { lastSpinDate: today };
                
                if (finalPrize.value > 0) {
                    updateData.activeSpinDiscount = finalPrize.value;
                    updateData.spinDiscountExpiry = expiryTime;
                    
                    toast({
                        title: "🎉 Congratulations!",
                        description: `You won ${finalPrize.label} Extra Discount! It's valid for only 5 minutes.`,
                    });
                } else {
                    toast({
                        title: "Better luck next time!",
                        description: "No discount won today. Try again tomorrow!",
                        variant: "default"
                    });
                }
                
                await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
                setHasSpunToday(true);
            } catch (e) {
                console.error(e);
            }
        }, 5000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-slate-950 min-h-screen text-white overflow-hidden flex flex-col">
            {banner ? (
                <div className="relative h-48 md:h-64 flex items-center overflow-hidden border-b border-white/10">
                    <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-10 container mx-auto px-6 flex justify-between items-center">
                        <div className="max-w-xl">
                            <Button asChild variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/10 p-0 h-auto">
                                <Link href="/" className="flex items-center gap-2">
                                    <div className="bg-white/20 p-1 rounded-full"><ArrowLeft className="h-4 w-4" /></div>
                                    <span className="font-bold uppercase tracking-widest text-[10px]">Back to Shopping</span>
                                </Link>
                            </Button>
                            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                                {banner.title}
                            </h1>
                            <p className="text-sm md:text-base text-gray-300 mt-1">{banner.description}</p>
                        </div>
                        {timeLeft !== null && (
                            <div className="hidden sm:flex flex-col items-end gap-1 bg-red-500/20 p-4 rounded-xl border border-red-500/30 backdrop-blur-sm">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Discount Expiry</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-red-500 animate-pulse" />
                                    <span className="font-mono text-2xl font-black text-red-500">{formatTime(timeLeft)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
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
            )}

            <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
                {!banner && (
                    <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                            Lucky Spin
                        </h1>
                        <p className="text-gray-400 text-sm">Spin once every day to win <span className="text-white font-bold">Extra Discount!</span></p>
                    </div>
                )}

                <div className="relative">
                    <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        <div className="w-8 h-10 bg-white rounded-t-full flex items-center justify-center border-x-4 border-b-[12px] border-slate-900">
                             <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white mt-4" />
                        </div>
                    </div>

                    <div className={cn(
                        "absolute inset-0 rounded-full bg-primary/20 blur-[60px] transition-opacity duration-1000",
                        isSpinning ? "opacity-100" : "opacity-0"
                    )} />

                    <div 
                        className={cn(
                            "w-72 h-72 sm:w-80 sm:h-80 rounded-full border-[12px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all",
                            isSpinning ? "duration-[5000ms] cubic-bezier(0.15, 0, 0, 1) scale-[1.02]" : "duration-500"
                        )}
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            filter: isSpinning ? 'blur(0.5px)' : 'none'
                        }}
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
                                            className="stroke-slate-900/20 stroke-[0.5]"
                                        />
                                        <text 
                                            x="50" y="18" 
                                            fill="white" 
                                            fontSize="3.2" 
                                            fontWeight="900" 
                                            textAnchor="middle" 
                                            className="drop-shadow-sm"
                                            transform={`rotate(${angle/2}, 50, 50)`}
                                            style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
                                        >
                                            {prize.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center border-4 border-slate-700">
                             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center animate-pulse">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-xs space-y-4 pb-12">
                    {hasSpunToday ? (
                        <div className="flex flex-col items-center gap-3 bg-white/5 p-6 rounded-2xl border border-white/10 text-center animate-in zoom-in-95 duration-500">
                            <Ban className="h-10 w-10 text-red-400 opacity-50" />
                            <div>
                                <h3 className="font-bold text-lg">Already Spun Today!</h3>
                                <p className="text-xs text-gray-500 mt-1">You've already tried your luck for today. Come back tomorrow!</p>
                            </div>
                            {timeLeft !== null && (
                                <Button asChild className="w-full mt-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20">
                                    <Link href="/cart">Use Discount Now ({formatTime(timeLeft)})</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Button 
                            onClick={handleSpin} 
                            disabled={isSpinning} 
                            className={cn(
                                "w-full h-16 text-xl font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl shadow-purple-900/40 transition-all duration-300",
                                isSpinning ? "opacity-50 scale-95" : "hover:scale-105 active:scale-95"
                            )}
                        >
                            {isSpinning ? <Loader2 className="h-7 w-7 animate-spin" /> : "Spin the Wheel!"}
                        </Button>
                    )}

                    {result && !isSpinning && (
                        <Card className="bg-white/10 border-white/20 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-500 overflow-hidden backdrop-blur-md">
                            <div className="h-1 w-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                            <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                                {result.value > 0 ? (
                                    <>
                                        <div className="relative">
                                            <Trophy className="h-12 w-12 text-yellow-400 animate-bounce" />
                                            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-white animate-pulse" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Victory!</p>
                                            <p className="text-3xl font-black text-white">{result.label}</p>
                                            <div className="mt-2 flex items-center gap-1.5 justify-center text-red-400 text-[10px] font-bold uppercase animate-pulse">
                                                <Clock className="h-3 w-3" />
                                                Expires in 5 Minutes
                                            </div>
                                        </div>
                                        <Button asChild className="w-full bg-white text-slate-900 hover:bg-gray-200 font-black uppercase tracking-tight">
                                            <Link href="/cart">Go to Checkout</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="font-bold text-gray-300 text-lg">Better luck tomorrow! 🍀</p>
                                        <p className="text-xs text-gray-500 mt-1">Keep shopping for more rewards.</p>
                                    </div>
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
