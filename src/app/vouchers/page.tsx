
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Ticket, ArrowLeft } from "lucide-react";
import Link from "next/link";


const vouchers = [
    {
        code: "PABNA50",
        discount: "৳50 Off",
        description: "On orders over ৳500",
    },
    {
        code: "ELEC10",
        discount: "10% Off",
        description: "On all electronics items",
    },
    {
        code: "NEW100",
        discount: "৳100 OFF",
        description: "For your first purchase. No minimum spend.",
    }
]

export default function VouchersPage() {
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
                        {vouchers.map((voucher, index) => (
                            <div key={index} className="rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 shadow-sm overflow-hidden border-0">
                                <div className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Ticket className="h-10 w-10 text-primary" />
                                        <div>
                                            <h3 className="text-xl font-bold text-primary">{voucher.discount}</h3>
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
                                    <Button>
                                        <Download className="mr-2 h-4 w-4" />
                                        Collect
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
