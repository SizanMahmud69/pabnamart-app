
"use client";

import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Zap, ShoppingCart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { rgbToHsl } from '@/lib/utils';

interface FlashSalePopupProps {
    onOpenChange: (open: boolean) => void;
}

export default function FlashSalePopup({ onOpenChange }: FlashSalePopupProps) {
    const { newestFlashSaleProduct, markFlashSaleAsSeen } = useProducts();
    const [isOpen, setIsOpen] = useState(false);
    const [bgColor, setBgColor] = useState('from-purple-500 to-pink-500');
    const router = useRouter();

    useEffect(() => {
        if (newestFlashSaleProduct) {
            setIsOpen(true);
            onOpenChange(true);
            const img = new window.Image();
            img.crossOrigin = "Anonymous";
            img.src = newestFlashSaleProduct.images[0];
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                    const [h, s] = rgbToHsl(r, g, b);
                    setBgColor(`from-hsl(${h}, ${s}%, 85%) to-hsl(${h}, ${s}%, 95%)`);
                }
            };
        }
    }, [newestFlashSaleProduct]);

    const handleClose = () => {
        if (newestFlashSaleProduct) {
            markFlashSaleAsSeen(newestFlashSaleProduct.id);
        }
        setIsOpen(false);
        onOpenChange(false);
    };

    const handleShopNow = () => {
        handleClose();
        router.push('/flash-sale');
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose();
        } else {
            setIsOpen(true);
            onOpenChange(true);
        }
    }

    if (!newestFlashSaleProduct) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="w-[90vw] max-w-sm p-0 border-0 overflow-hidden rounded-xl">
                 <DialogHeader className="sr-only">
                    <DialogTitle>New Flash Sale Item</DialogTitle>
                    <DialogDescription>
                        A new item has been added to our flash sale: {newestFlashSaleProduct.name}
                    </DialogDescription>
                </DialogHeader>
                <div className={`relative bg-gradient-to-br ${bgColor} p-6 text-center flex flex-col items-center justify-center space-y-4`}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-gray-800/70 hover:text-gray-900 hover:bg-black/10 rounded-full"
                        onClick={handleClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    
                    <div className="relative w-40 h-40 rounded-lg overflow-hidden shadow-lg border-4 border-white">
                         <Image 
                            src={newestFlashSaleProduct.images[0]} 
                            alt={newestFlashSaleProduct.name} 
                            fill 
                            className="object-cover"
                            sizes="160px"
                        />
                    </div>
                    
                    <Zap className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                    
                    <h2 className="text-xl font-bold text-gray-900">New Flash Sale Item!</h2>
                    
                     <div className="bg-black/5 p-4 rounded-lg w-full">
                        <p className="font-semibold text-gray-800 truncate">{newestFlashSaleProduct.name}</p>
                        <p className="mt-1">
                            <span className="text-2xl font-bold text-primary">৳{newestFlashSaleProduct.price}</span>
                            <span className="ml-2 text-gray-600 line-through">৳{newestFlashSaleProduct.originalPrice}</span>
                        </p>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                        onClick={handleShopNow}
                    >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Shop Now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
