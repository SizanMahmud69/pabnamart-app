
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function AffiliatePage() {
    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/account">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Account
                        </Link>
                    </Button>
                    <Card>
                        <CardHeader className="text-center">
                            <Users className="mx-auto h-12 w-12 text-primary" />
                            <CardTitle className="text-3xl mt-2">Join Our Affiliate Program</CardTitle>
                            <CardDescription>Earn money by promoting our products.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground mb-6">
                                Our affiliate program is coming soon! Sign up to be the first to know when it launches and start earning commissions.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="flex flex-col items-center gap-2">
                                    <DollarSign className="h-8 w-8 text-green-500" />
                                    <h3 className="font-semibold">Competitive Commissions</h3>
                                    <p className="text-sm text-muted-foreground">Earn a percentage on every sale you refer.</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <BarChart2 className="h-8 w-8 text-blue-500" />
                                    <h3 className="font-semibold">Real-Time Tracking</h3>
                                    <p className="text-sm text-muted-foreground">Track your referrals and earnings in your dashboard.</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 text-purple-500" />
                                    <h3 className="font-semibold">Dedicated Support</h3>
                                    <p className="text-sm text-muted-foreground">Our affiliate team is here to help you succeed.</p>
                                </div>
                            </div>
                            <Button size="lg">Notify Me When It's Ready</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
