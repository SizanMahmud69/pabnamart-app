
"use client";
import { useAuth, withAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import type { AffiliateEarning } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, DollarSign } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const db = getFirestore(app);

function AffiliateReportPage() {
    const { user } = useAuth();
    const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const earningsQuery = query(collection(db, 'affiliateEarnings'), where('affiliateUid', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribeEarnings = onSnapshot(earningsQuery, (snapshot) => {
            setEarnings(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as AffiliateEarning)));
            setLoading(false);
        });

        return () => {
            unsubscribeEarnings();
        }
    }, [user]);

    const stats = {
        totalEarnings: earnings.reduce((acc, e) => acc + e.commissionAmount, 0),
        pendingEarnings: earnings.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.commissionAmount, 0),
        paidEarnings: earnings.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.commissionAmount, 0),
    };

    if(loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                   <BarChart2 className="h-8 w-8 text-primary" />
                    Earnings Report
                </h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{stats.totalEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">৳{stats.paidEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">৳{stats.pendingEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Commission History</CardTitle>
                    <CardDescription>A list of all your commission earnings.</CardDescription>
                </CardHeader>
                <CardContent>
                     {earnings.length > 0 ? (
                        <div className="space-y-2">
                            {earnings.map(earning => (
                                <div key={earning.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                    <div>
                                        <p className="font-semibold">{earning.productName}</p>
                                        <p className="text-xs text-muted-foreground">Order: #{earning.orderNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">+ ৳{earning.commissionAmount.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{earning.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-8">No earnings history found.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
export default withAuth(AffiliateReportPage);
