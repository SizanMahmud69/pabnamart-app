"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface FlashSaleProps {
  products: Product[];
}

const CountdownTimer = () => {
  const calculateTimeLeft = () => {
    const difference = +new Date("2025-01-01") - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
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

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval as keyof typeof timeLeft]) {
      return;
    }

    timerComponents.push(
      <span key={interval} className="bg-primary text-primary-foreground text-lg font-bold p-2 rounded-md">
        {String(timeLeft[interval as keyof typeof timeLeft]).padStart(2, '0')}
      </span>
    );
  });

  return (
    <div className="flex items-center gap-2">
      {timerComponents.length ? (
        <>
            {timerComponents[0]}
            <span className="font-bold text-xl">:</span>
            {timerComponents[1]}
            <span className="font-bold text-xl">:</span>
            {timerComponents[2]}
        </>
      ) : (
        <span>Time's up!</span>
      )}
    </div>
  );
};


export default function FlashSale({ products }: FlashSaleProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-b from-purple-100 to-white">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Flash Sale</h2>
                        <p className="text-gray-600">Limited time offers, grab them fast!</p>
                    </div>
                    <CountdownTimer />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {products.map(product => (
                        <Link key={product.id} href={`/products/${product.id}`} className="block group">
                            <Card className="overflow-hidden h-full">
                                <CardContent className="p-2">
                                    <div className="relative aspect-square w-full">
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className="object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                            data-ai-hint="product lifestyle"
                                        />
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            - ৳{Math.round(product.price * 0.2)}
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
                                        <p className="text-md font-bold text-primary">৳{(product.price * 0.8).toFixed(2)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
