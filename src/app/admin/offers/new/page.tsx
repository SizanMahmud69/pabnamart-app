
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const db = getFirestore(app);

const categories = [
  "Men's Fashion",
  "Women's Fashion",
  "Cosmetics",
  "Groceries",
  "Mobile & Computers",
  "Electronics",
];

export default function NewOfferPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [category, setCategory] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);
        const formData = new FormData(e.currentTarget);
        
        const offerData = {
            name: category,
            discount: Number(formData.get('discount')),
            startDate: formData.get('start-date') as string,
            endDate: formData.get('end-date') as string,
        };

        try {
            await addDoc(collection(db, 'offers'), offerData);
            toast({
                title: "Offer Created",
                description: "The new offer has been successfully created.",
            });
            router.push('/admin/offers');
        } catch (error) {
            console.error("Error creating offer: ", error);
            toast({ title: "Error", description: "Failed to create offer.", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/offers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Offers
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Offer</CardTitle>
                            <CardDescription>Fill in the details for the new offer campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Category Name</Label>
                                <Select onValueChange={setCategory} required value={category} disabled={isCreating}>
                                    <SelectTrigger id="name">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="discount">Discount Percentage</Label>
                                <Input id="discount" name="discount" type="number" placeholder="e.g., 40" required disabled={isCreating}/>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input id="start-date" name="start-date" type="date" required disabled={isCreating}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input id="end-date" name="end-date" type="date" required disabled={isCreating}/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isCreating}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Offer
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
