
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

const vouchers = [
    {
        code: "SALE20",
        discount: "20% OFF",
        description: "On all electronics items. Minimum spend ৳1000.",
        expiry: "Expires in 3 days"
    },
    {
        code: "FREESHIP",
        discount: "Free Shipping",
        description: "On orders over ৳500.",
        expiry: "Expires in 1 week"
    },
    {
        code: "NEW100",
        discount: "৳100 OFF",
        description: "For your first purchase. No minimum spend.",
        expiry: "Expires in 1 month"
    }
]

export default function VouchersPage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl flex items-center justify-center gap-2">
                            <Ticket className="h-8 w-8 text-primary" />
                            Available Vouchers
                        </CardTitle>
                        <CardDescription>
                            Collect these vouchers to get extra savings on your purchases!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {vouchers.map((voucher, index) => (
                            <div key={index} className="border-2 border-dashed rounded-lg p-4 flex items-center justify-between gap-4 bg-purple-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="text-primary">
                                        <Ticket className="h-12 w-12" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary">{voucher.discount}</h3>
                                        <p className="text-sm text-muted-foreground">{voucher.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{voucher.expiry}</p>
                                    </div>
                                </div>
                                <Button>Collect</Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
