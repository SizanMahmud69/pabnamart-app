
"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface FlashSaleProps {
  products: Product[];
}

const CountdownTimer = ({ expiryDate }: { expiryDate: string | null }) => {
    const [isMounted, setIsMounted] = useState(false);

    const calculateTimeLeft = () => {
        if (!expiryDate) return { hours: 0, minutes: 0, seconds: 0 };

        const difference = +new Date(expiryDate) - +new Date();
        let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (!isMounted || !expiryDate) {
        return null;
    }

    const formatTime = (time: number) => String(time).padStart(2, '0');

    return (
        <div className="flex items-center gap-2">
            <span className="text-gray-600">Ending in:</span>
            <span className="bg-primary text-primary-foreground text-lg font-bold p-2 rounded-md min-w-[40px] text-center">
                {formatTime(timeLeft.hours)}
            </span>
            <span className="font-bold text-xl">:</span>
            <span className="bg-primary text-primary-foreground text-lg font-bold p-2 rounded-md w-10 text-center">
                {formatTime(timeLeft.minutes)}
            </span>
            <span className="font-bold text-xl">:</span>
            <span className="bg-primary text-primary-foreground text-lg font-bold p-2 rounded-md w-10 text-center">
                {formatTime(timeLeft.seconds)}
            </span>
        </div>
    );
};


export default function FlashSale({ products }: FlashSaleProps) {
    const [closestExpiry, setClosestExpiry] = useState<string | null>(null);

    useEffect(() => {
        if (products.length > 0) {
            const closestDate = products.reduce((closest, current) => {
                const closestTime = new Date(closest.flashSaleEndDate!).getTime();
                const currentTime = new Date(current.flashSaleEndDate!).getTime();
                return currentTime < closestTime ? current : closest;
            }).flashSaleEndDate;
            setClosestExpiry(closestDate || null);
        } else {
            setClosestExpiry(null);
        }
    }, [products]);

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <Card className="bg-purple-50/50">
            <CardContent className="p-4">
                <div className="flex flex-col items-center text-center mb-4 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Flash Sale</h2>
                        <p className="text-gray-600">Don't miss out on these amazing deals, ending soon!</p>
                    </div>
                    <CountdownTimer expiryDate={closestExpiry} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-4">
                    {products.slice(0, 2).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                 <div className="mt-6 text-center">
                    <Button asChild variant="outline">
                        <Link href="/flash-sale">
                            See More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
