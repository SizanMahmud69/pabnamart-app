
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection, addDoc, getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

export default function NewVoucherPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
    const [discount, setDiscount] = useState(0);
    const [minSpend, setMinSpend] = useState<number | undefined>(undefined);
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState<'order' | 'shipping'>('order');
    const [usageLimit, setUsageLimit] = useState<number | undefined>(1);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            // Use setDoc with the voucher code as the ID
            const voucherRef = doc(db, 'vouchers', voucherCode);
            await setDoc(voucherRef, {
                code: voucherCode,
                type: voucherType,
                discount: Number(discount),
                minSpend: minSpend ? Number(minSpend) : null,
                description,
                discountType,
                isReturnVoucher: false,
                usageLimit: usageLimit ? Number(usageLimit) : 1,
                createdAt: new Date().toISOString(),
            });
            
            toast({
                title: "Voucher Created",
                description: "The new voucher has been successfully created.",
            });
            router.push('/admin/vouchers');
        } catch (error) {
            console.error("Error creating voucher: ", error);
            toast({ title: "Error", description: "Failed to create voucher. The code might already exist.", variant: "destructive"});
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/vouchers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Vouchers
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Voucher</CardTitle>
                            <CardDescription>Fill in the details for the new voucher.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Voucher Code</Label>
                                <Input id="code" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="e.g., PABNA50" required disabled={isCreating}/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., On orders over ৳500" required disabled={isCreating}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Voucher Type</Label>
                                    <Select required value={voucherType} onValueChange={(v) => setVoucherType(v as 'fixed' | 'percentage')} disabled={isCreating}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fixed</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountType">Discount Type</Label>
                                    <Select required value={discountType} onValueChange={(v) => setDiscountType(v as 'order' | 'shipping')} disabled={isCreating}>
                                        <SelectTrigger id="discountType">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="order">Order</SelectItem>
                                            <SelectItem value="shipping">Shipping</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount Value</Label>
                                    <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required placeholder="e.g., 50 or 10" disabled={isCreating}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="min-spend">Minimum Spend (৳)</Label>
                                    <Input id="min-spend" type="number" value={minSpend || ''} onChange={(e) => setMinSpend(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 500" disabled={isCreating}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="usage-limit">Usage Limit</Label>
                                    <Input id="usage-limit" type="number" value={usageLimit || ''} onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 1" required min={1} disabled={isCreating}/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isCreating}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Voucher
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
