
"use client";

import { useEffect, useState } from 'react';
import { useVouchers } from '@/hooks/useVouchers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Ticket, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VoucherPopupProps {
    isFlashSalePopupOpen: boolean;
}

export default function VoucherPopup({ isFlashSalePopupOpen }: VoucherPopupProps) {
    const { popupVoucher, markVoucherAsSeen } = useVouchers();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (popupVoucher && !isFlashSalePopupOpen) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [popupVoucher, isFlashSalePopupOpen]);

    const handleClose = () => {
        if (popupVoucher) {
            markVoucherAsSeen(popupVoucher.code);
        }
        setIsOpen(false);
    };

    const handleCollect = () => {
        handleClose();
        router.push('/vouchers');
    };

    if (!popupVoucher) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="w-[90vw] max-w-sm p-0 border-0 overflow-hidden rounded-xl">
                 <DialogHeader className="sr-only">
                    <DialogTitle>New Voucher Available</DialogTitle>
                    <DialogDescription>
                        A new voucher is available for you to collect. {popupVoucher.description}
                    </DialogDescription>
                </DialogHeader>
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-white text-center flex flex-col items-center justify-center space-y-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
                        onClick={handleClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    
                    <Ticket className="w-20 h-20 text-yellow-300 drop-shadow-lg" />
                    
                    <h2 className="text-2xl font-bold">New Voucher Available!</h2>
                    
                    <div className="bg-white/20 p-4 rounded-lg w-full">
                        <p className="font-bold text-3xl">
                           {popupVoucher.discountType === 'shipping' ? 'Free Shipping' : (popupVoucher.type === 'fixed' ? `৳${popupVoucher.discount} Off` : `${popupVoucher.discount}% Off`)}
                        </p>
                        <p className="mt-1 text-sm">{popupVoucher.description}</p>
                    </div>

                    <p className="text-xs text-white/80">
                        A new voucher has been added. Collect it now to save on your next purchase!
                    </p>

                    <Button 
                        size="lg" 
                        className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold"
                        onClick={handleCollect}
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Collect Now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
