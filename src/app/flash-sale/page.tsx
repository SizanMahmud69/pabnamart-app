
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { useState, useEffect } from 'react';
import type { Product } from '@/types';

const CountdownTimer = ({ expiryDate }: { expiryDate: string | null }) => {
    const calculateTimeLeft = () => {
        if (!expiryDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const difference = +new Date(expiryDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const formatTime = (time: number) => String(time).padStart(2, '0');

    if (!expiryDate) return null;

    return (
        <div className="flex items-center gap-2 sm:gap-4 text-lg">
            <span className="text-gray-600 font-medium">Ending in:</span>
            <div className="flex gap-2 items-center">
                <div className="flex flex-col items-center">
                    <span className="bg-primary text-primary-foreground font-bold p-2 sm:p-3 rounded-md min-w-[40px] sm:min-w-[56px] text-center text-xl sm:text-2xl">
                        {formatTime(timeLeft.days)}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground mt-1">Days</span>
                </div>
                <span className="font-bold text-2xl pb-5">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-primary text-primary-foreground font-bold p-2 sm:p-3 rounded-md min-w-[40px] sm:min-w-[56px] text-center text-xl sm:text-2xl">
                        {formatTime(timeLeft.hours)}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground mt-1">Hours</span>
                </div>
                <span className="font-bold text-2xl pb-5">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-primary text-primary-foreground font-bold p-2 sm:p-3 rounded-md min-w-[40px] sm:min-w-[56px] text-center text-xl sm:text-2xl">
                        {formatTime(timeLeft.minutes)}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground mt-1">Mins</span>
                </div>
                <span className="font-bold text-2xl pb-5">:</span>
                <div className="flex flex-col items-center">
                    <span className="bg-primary text-primary-foreground font-bold p-2 sm:p-3 rounded-md min-w-[40px] sm:min-w-[56px] text-center text-xl sm:text-2xl">
                        {formatTime(timeLeft.seconds)}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase font-bold text-muted-foreground mt-1">Secs</span>
                </div>
            </div>
        </div>
    );
};

export default function FlashSalePage() {
    const { getFlashSaleProducts } = useProducts();
    const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
    const [closestExpiry, setClosestExpiry] = useState<string | null>(null);
    
    useEffect(() => {
        const { products, closestExpiry } = getFlashSaleProducts();
        setFlashSaleProducts(products);
        setClosestExpiry(closestExpiry);
    }, [getFlashSaleProducts]);


    return (
        <div className="bg-purple-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8 p-8 bg-white rounded-lg shadow-md border-t-4 border-primary">
                    <h1 className="text-4xl font-bold text-primary mb-2">Flash Sale</h1>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        Don't miss out on these amazing deals, ending soon!
                    </p>
                    <div className="flex justify-center">
                        <CountdownTimer expiryDate={closestExpiry} />
                    </div>
                </div>
                
                {flashSaleProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {flashSaleProducts.map(product => (
                            <ProductCard key={product.id} product={product} isFlashSaleContext={true} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold">No active flash sales right now.</h2>
                        <p className="text-gray-500 mt-2">Check back soon for more amazing deals!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
