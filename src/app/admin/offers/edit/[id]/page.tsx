
"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Offer } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
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

export default function EditOfferPage() {
    const router = useRouter();
    const params = useParams();
    const offerId = params.id as string;
    const { toast } = useToast();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (!offerId) return;

        const fetchOffer = async () => {
            setLoading(true);
            const offerRef = doc(db, 'offers', offerId);
            const docSnap = await getDoc(offerRef);
            if (docSnap.exists()) {
                const offerData = { id: docSnap.id, ...docSnap.data() } as Offer;
                setOffer(offerData);
                setCategory(offerData.name);
            } else {
                toast({ title: "Error", description: "Offer not found.", variant: "destructive" });
                router.push('/admin/offers');
            }
            setLoading(false);
        };
        fetchOffer();
    }, [offerId, router, toast]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        const offerData = {
            name: category,
            discount: Number(formData.get('discount')),
            startDate: formData.get('start-date') as string,
            endDate: formData.get('end-date') as string,
        };

        try {
            const offerRef = doc(db, 'offers', offerId);
            await updateDoc(offerRef, offerData);
            toast({
                title: "Offer Updated",
                description: "The offer has been successfully updated.",
            });
            router.push('/admin/offers');
        } catch (error) {
            console.error("Error updating offer: ", error);
            toast({ title: "Error", description: "Failed to update offer.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <LoadingSpinner />
    }
    
    if (!offer) {
        return null;
    }

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
                            <CardTitle>Edit Offer</CardTitle>
                            <CardDescription>Update the details for the offer campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Category Name</Label>
                                 <Select onValueChange={setCategory} required value={category} disabled={isSaving}>
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
                                <Input id="discount" name="discount" type="number" defaultValue={offer.discount} required disabled={isSaving}/>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input id="start-date" name="start-date" type="date" defaultValue={offer.startDate} required disabled={isSaving}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input id="end-date" name="end-date" type="date" defaultValue={offer.endDate} required disabled={isSaving}/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
