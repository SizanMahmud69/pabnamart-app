
"use client";

import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { useState, useEffect } from 'react';
import type { Product } from '@/types';

const CountdownTimer = () => {
  const calculateTimeLeft = () => {
    // Set a future date for the countdown
    const difference = +new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1) - +new Date();
    let timeLeft = {
        hours: 0,
        minutes: 0,
        seconds: 0
    };

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

  const formatTime = (time: number) => String(time).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-lg">
        <span className="text-gray-600">Ending in:</span>
        <span className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-12 text-center">
            {formatTime(timeLeft.hours)}
        </span>
        <span className="font-bold">:</span>
        <span className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-12 text-center">
            {formatTime(timeLeft.minutes)}
        </span>
        <span className="font-bold">:</span>
        <span className="bg-primary text-primary-foreground font-bold p-2 rounded-md w-12 text-center">
            {formatTime(timeLeft.seconds)}
        </span>
    </div>
  );
};

export default function FlashSalePage() {
  const { products: allProducts } = useProducts();
  const flashSaleProducts: Product[] = allProducts.filter(p => p.isFlashSale).map(p => ({
    ...p,
    originalPrice: p.originalPrice || p.price + (p.price * 0.2), // Mock discount if not present
  }));

  return (
    <div className="bg-purple-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-4xl font-bold text-primary mb-2">Flash Sale</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Don't miss out on these amazing deals, ending soon!
          </p>
          <div className="mt-4 flex justify-center">
            <CountdownTimer />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {flashSaleProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
