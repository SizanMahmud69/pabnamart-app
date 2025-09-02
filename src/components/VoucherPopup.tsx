
"use client";

import { useEffect, useState } from 'react';
import { useVouchers } from '@/hooks/useVouchers';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Ticket, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VoucherPopup() {
    const { newestVoucher, markVoucherAsSeen } = useVouchers();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (newestVoucher) {
            setIsOpen(true);
        }
    }, [newestVoucher]);

    const handleClose = () => {
        if (newestVoucher) {
            markVoucherAsSeen(newestVoucher.code);
        }
        setIsOpen(false);
    };

    const handleCollect = () => {
        handleClose();
        router.push('/vouchers');
    };

    if (!newestVoucher) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md p-0 border-0 overflow-hidden">
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-white text-center flex flex-col items-center justify-center space-y-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                        onClick={handleClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    
                    <Ticket className="w-20 h-20 text-yellow-300 drop-shadow-lg" />
                    
                    <h2 className="text-2xl font-bold">New Voucher Available!</h2>
                    
                    <div className="bg-white/20 p-4 rounded-lg w-full">
                        <p className="font-bold text-3xl">
                           {newestVoucher.discountType === 'shipping' ? 'Free Shipping' : (newestVoucher.type === 'fixed' ? `৳${newestVoucher.discount} Off` : `${newestVoucher.discount}% Off`)}
                        </p>
                        <p className="mt-1 text-sm">{newestVoucher.description}</p>
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
