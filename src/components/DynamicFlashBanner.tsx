
"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import Link from 'next/link';
import { Zap, Clock } from 'lucide-react';

export default function DynamicFlashBanner({ products }: { products: Product[] }) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        if (products.length > 0) {
            // Pick a random product from flash sale on mount
            const randomIndex = Math.floor(Math.random() * products.length);
            setSelectedProduct(products[randomIndex]);
        }
    }, [products]);

    useEffect(() => {
        if (!selectedProduct?.flashSaleEndDate) return;

        const calculateTime = () => {
            const expiry = new Date(selectedProduct.flashSaleEndDate!).getTime();
            const now = new Date().getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return false;
            } else {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                });
                return true;
            }
        };

        calculateTime();
        const interval = setInterval(() => {
            const isRunning = calculateTime();
            if (!isRunning) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [selectedProduct]);

    if (!selectedProduct) return null;

    const format = (n: number) => n.toString().padStart(2, '0');

    return (
        <Link href="/flash-sale" className="block group">
            <div className="relative h-48 md:h-64 rounded-lg overflow-hidden flex items-center bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 md:px-12 shadow-inner">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="h-32 w-32 rotate-12 fill-white" />
                </div>

                {/* Left Side: Product Image in White Circle */}
                <div className="flex-shrink-0 relative z-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white border-[6px] border-white/30 shadow-2xl overflow-hidden flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
                        <img 
                            src={selectedProduct.images[0]} 
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -top-1 -left-1 bg-yellow-400 text-red-700 rounded-full p-1.5 md:p-2 shadow-lg animate-bounce border-2 border-white">
                        <Zap className="h-3 w-3 md:h-5 md:w-5 fill-current" />
                    </div>
                </div>

                {/* Right Side: Text and Timer */}
                <div className="flex-grow ml-6 md:ml-12 space-y-2 md:space-y-4 relative z-10">
                    <div className="space-y-0 md:space-y-1">
                        <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter drop-shadow-lg leading-none">
                            Flash Sale Live!
                        </h2>
                        <p className="text-[9px] md:text-sm font-bold opacity-90 uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-full inline-block">
                            Deal on: {selectedProduct.name}
                        </p>
                    </div>

                    {timeLeft && (
                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-[9px] md:text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Ending In:
                            </span>
                            <div className="flex items-center gap-1.5 md:gap-3">
                                <TimerBox value={format(timeLeft.days)} label="Days" />
                                <span className="font-bold text-lg md:text-2xl opacity-50">:</span>
                                <TimerBox value={format(timeLeft.hours)} label="Hrs" />
                                <span className="font-bold text-lg md:text-2xl opacity-50">:</span>
                                <TimerBox value={format(timeLeft.minutes)} label="Min" />
                                <span className="font-bold text-lg md:text-2xl opacity-50">:</span>
                                <TimerBox value={format(timeLeft.seconds)} label="Sec" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

function TimerBox({ value, label }: { value: string, label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-white text-red-600 font-black text-sm md:text-2xl px-1.5 py-0.5 md:px-3 md:py-2 rounded shadow-md min-w-[32px] md:min-w-[48px] text-center">
                {value}
            </div>
            <span className="text-[7px] md:text-[9px] font-black uppercase mt-1 opacity-70 tracking-tighter">{label}</span>
        </div>
    );
}
