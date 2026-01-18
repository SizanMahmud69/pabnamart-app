
"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, type Firestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Category } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app) {
        setLoading(false);
        return;
    }
    const db = getFirestore(app);
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
            <Carousel opts={{ align: "start" }} className="w-full relative px-8">
                <CarouselContent className="-ml-2">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <CarouselItem key={i} className="pl-2 basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/8">
                                <div className="flex flex-col items-center gap-2 p-2 w-24">
                                    <Skeleton className="w-16 h-16 rounded-full" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </CarouselItem>
                        ))
                    ) : (
                        categories.map((category) => (
                            <CarouselItem key={category.id} className="pl-2 basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/8">
                                <Link href={`/category/${encodeURIComponent(category.name)}`} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-purple-100/50 transition-colors w-24 text-center">
                                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border">
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-muted" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium whitespace-normal break-words">{category.name}</span>
                                </Link>
                            </CarouselItem>
                        ))
                    )}
                </CarouselContent>
                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
        </CardContent>
    </Card>
  );
}
