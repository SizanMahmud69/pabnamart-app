
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewVoucherPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        toast({
            title: "Voucher Created",
            description: "The new voucher has been successfully created.",
        });
        router.push('/admin/vouchers');
    };

    return (
        <div className="container mx-auto p-4">
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
                                <Input id="code" placeholder="e.g., PABNA50" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Voucher Type</Label>
                                    <Select required>
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
                                    <Label htmlFor="value">Value</Label>
                                    <Input id="value" type="number" placeholder="e.g., 50 or 10" required />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="min-spend">Minimum Spend (৳)</Label>
                                <Input id="min-spend" type="number" placeholder="e.g., 500" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit">Create Voucher</Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
