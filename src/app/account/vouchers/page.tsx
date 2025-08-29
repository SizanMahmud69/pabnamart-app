
"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Ticket, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useVouchers } from "@/hooks/useVouchers";
import { Card, CardContent } from "@/components/ui/card";
import { withAuth } from "@/hooks/useAuth";

function MyVouchersPage() {
    const { collectedVouchers } = useVouchers();

    const generalVouchers = collectedVouchers.filter(v => !v.isReturnVoucher);
    const returnVouchers = collectedVouchers.filter(v => v.isReturnVoucher);

    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto max-w-md px-4 py-6 space-y-6">
                
                <div className="flex items-center relative">
                    <Button asChild variant="ghost" size="icon" className="absolute">
                         <Link href="/account">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="text-center flex-grow">
                        <h1 className="text-2xl font-bold">My Vouchers</h1>
                    </div>
                </div>

                {collectedVouchers.length === 0 ? (
                     <Card>
                        <CardContent className="text-center py-16">
                            <Ticket className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-4 text-xl font-semibold">No Vouchers Collected</h2>
                            <p className="text-muted-foreground">You haven't collected any vouchers yet.</p>
                            <Button asChild className="mt-4">
                                <Link href="/vouchers">Collect Vouchers</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {returnVouchers.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Return Vouchers</h2>
                                <div className="space-y-4">
                                    {returnVouchers.map((voucher) => (
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
                                                <Button variant="outline" disabled>Collected</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {generalVouchers.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold mb-4 mt-6">General Vouchers</h2>
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
                                                <Button variant="outline" disabled>Collected</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-4">
                            <Button asChild>
                                <Link href="/vouchers">Collect More Vouchers</Link>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default withAuth(MyVouchersPage);
