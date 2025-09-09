
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

export default function ReturnDetailsPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const params = useParams();
    const orderId = params.id as string;
    const router = useRouter();

    useEffect(() => {
        if (!orderId) return;

        const fetchOrderData = async () => {
            setLoading(true);
            try {
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (orderDocSnap.exists()) {
                    setOrder({ id: orderDocSnap.id, ...orderDocSnap.data() } as Order);
                } else {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/admin/returns');
                }
            } catch (error) {
                console.error("Error fetching return details:", error);
                toast({ title: "Error", description: "Failed to fetch return details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [orderId, toast, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return null;
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline">
                    <Link href="/admin/returns">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Return Requests
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Return Details</CardTitle>
                        <CardDescription>For order #{order.orderNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Return Information</h3>
                            <div className="space-y-2 rounded-md border p-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reason:</span>
                                    <span className="font-medium">{order.returnReason || 'N/A'}</span>
                                </div>
                                <Separator />
                                <div>
                                    <span className="text-muted-foreground">Comments:</span>
                                    <p className="mt-1">{order.returnComments || 'No comments provided.'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Items in this order</h3>
                            <div className="space-y-4 rounded-md border p-4">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">৳{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
