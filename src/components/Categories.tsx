
"use client";

import Link from 'next/link';
import { Shirt, Heart, ShoppingBasket, Smartphone, Tv2, Laptop } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Category } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const db = getFirestore(app);

const iconMap: { [key: string]: LucideIcon } = {
  Shirt,
  Heart,
  ShoppingBasket,
  Smartphone,
  Tv2,
  Laptop,
  "default": ShoppingBasket,
};


export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(cats);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Card className="bg-purple-50/30">
        <CardContent className="p-4">
            <h2 className="text-2xl font-bold mb-4">Categories</h2>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 pb-4">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-2 w-24">
                                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))
                    ) : (
                        categories.map((category) => {
                            const Icon = iconMap[category.icon] || iconMap.default;
                            return (
                                <Link href={`/category/${encodeURIComponent(category.name)}`} key={category.id} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-purple-100/50 transition-colors w-24 text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${category.color}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <span className="text-sm font-medium whitespace-normal break-words">{category.name}</span>
                                </Link>
                            )
                        })
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
