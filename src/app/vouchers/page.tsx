
"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Ticket, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useVouchers } from "@/hooks/useVouchers";
import type { Voucher } from "@/types";
import { useEffect, useState } from "react";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";

const db = getFirestore(app);

export default function VouchersPage() {
    const { collectedVouchers, collectVoucher, availableReturnVouchers } = useVouchers();
    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "vouchers"), (snapshot) => {
            const vouchersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Voucher))
                .filter(v => !v.isReturnVoucher); // Filter out return vouchers
            setAvailableVouchers(vouchersData);
        });
        return () => unsubscribe();
    }, []);

    const isCollected = (code: string) => collectedVouchers.some(v => v.code === code);
    
    const generalVouchers = availableVouchers.filter(v => !v.isReturnVoucher);
    const returnVouchersToCollect = availableReturnVouchers.filter(v => !isCollected(v.code));

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-md px-4 py-6 space-y-6">
                
                <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-primary">Collect Vouchers</h1>
                    <p className="text-muted-foreground">
                        Apply these vouchers at checkout to get amazing discounts.
                    </p>
                </div>

                {returnVouchersToCollect.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Your Return Vouchers</h2>
                        <div className="space-y-4">
                            {returnVouchersToCollect.map((voucher) => (
                                <div key={voucher.code} className="rounded-lg bg-gradient-to-r from-green-100 to-blue-100 shadow-sm overflow-hidden border-0">
                                    <div className="p-4">
                                        <div className="flex items-center gap-4">
                                            <Ticket className="h-10 w-10 text-green-600" />
                                            <div>
                                                <h3 className="text-xl font-bold text-green-700">৳{voucher.discount} Off</h3>
                                                <p className="text-sm text-gray-600">{voucher.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                     <div className="p-4 bg-white/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Voucher Code</p>
                                            <p className="font-mono font-bold">{voucher.code}</p>
                                        </div>
                                         <Button onClick={() => collectVoucher(voucher)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Collect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <div>
                    <h2 className="text-xl font-bold mb-4 mt-6">Available Vouchers</h2>
                    <div className="space-y-4">
                        {generalVouchers.map((voucher) => (
                            <div key={voucher.code} className="rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 shadow-sm overflow-hidden border-0">
                                <div className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Ticket className="h-10 w-10 text-primary" />
                                        <div>
                                            <h3 className="text-xl font-bold text-primary">
                                                {voucher.discountType === 'shipping' ? 'Free Shipping' : (voucher.type === 'fixed' ? `৳${voucher.discount} Off` : `${voucher.discount}% Off`)}
                                            </h3>
                                            <p className="text-sm text-gray-600">{voucher.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="p-4 bg-white/50 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Voucher Code</p>
                                        <p className="font-mono font-bold">{voucher.code}</p>
                                    </div>
                                    <Button onClick={() => collectVoucher(voucher)} disabled={isCollected(voucher.code)}>
                                        {isCollected(voucher.code) ? (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Collected
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" />
                                                Collect
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
