
"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Ticket, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useVouchers } from "@/hooks/useVouchers";
import type { Voucher } from "@/types";

const availableVouchers: Voucher[] = [
    {
        code: "PABNA50",
        discount: 50,
        type: 'fixed',
        description: "On orders over ৳500",
        minSpend: 500,
        discountType: 'order',
    },
    {
        code: "FREESHIP",
        discount: 50,
        type: 'fixed',
        description: "Free Shipping on all orders",
        discountType: 'shipping',
    },
    {
        code: "NEW100",
        discount: 100,
        type: 'fixed',
        description: "For your first purchase. No minimum spend.",
        discountType: 'order',
    }
]

export default function VouchersPage() {
    const { collectedVouchers, collectVoucher } = useVouchers();

    const isCollected = (code: string) => collectedVouchers.some(v => v.code === code);

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

                <div>
                    <h2 className="text-xl font-bold mb-4">Available Vouchers</h2>
                    <div className="space-y-4">
                        {availableVouchers.map((voucher) => (
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
