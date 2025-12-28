
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import type { Product, Category } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { collection, getFirestore, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import Image from 'next/image';

const db = getFirestore(app);

export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { addProduct } = useProducts();
    const [isLoading, setIsLoading] = useState(false);
    const [category, setCategory] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [freeShipping, setFreeShipping] = useState(false);
    const [isFlashSale, setIsFlashSale] = useState(false);
    const [flashSaleEndDate, setFlashSaleEndDate] = useState('');
    const [flashSaleDiscount, setFlashSaleDiscount] = useState<number | undefined>(undefined);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
        });
        return () => unsubscribe();
    }, []);

    const uniqueCategories = useMemo(() => {
        const seen = new Set();
        return categories.filter(cat => {
            const duplicate = seen.has(cat.name);
            seen.add(cat.name);
            return !duplicate;
        });
    }, [categories]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);
        }
    };
    
    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const form = new FormData(e.currentTarget);
        
        let uploadedImageUrls: string[] = [];
        if (imageFiles.length > 0) {
            try {
                for (const file of imageFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Failed to upload image.');
                    }
                    const { url } = await response.json();
                    uploadedImageUrls.push(url);
                }
            } catch (error) {
                 console.error("Image upload failed:", error);
                 toast({
                    title: "Error",
                    description: "Failed to upload images. Please check your storage configuration.",
                    variant: "destructive"
                });
                 setIsLoading(false);
                 return;
            }
        }

        if (uploadedImageUrls.length === 0) {
            uploadedImageUrls.push('https://i.ibb.co/gV28rC7/default-image.jpg');
        }

        const originalPriceValue = form.get('originalPrice') as string;
        const returnPolicyValue = form.get('returnPolicy') as string;

        const newProductData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'> = {
            name: form.get('name') as string,
            description: form.get('description') as string,
            price: parseFloat(form.get('price') as string) || 0,
            originalPrice: originalPriceValue ? parseFloat(originalPriceValue) : undefined,
            stock: parseInt(form.get('stock') as string, 10) || 0,
            category: category,
            images: uploadedImageUrls,
            details: form.get('details') as string,
            freeShipping: freeShipping,
            isFlashSale: isFlashSale,
            flashSaleEndDate: isFlashSale ? flashSaleEndDate : '',
            flashSaleDiscount: isFlashSale ? (flashSaleDiscount || undefined) : undefined,
            returnPolicy: returnPolicyValue ? parseInt(returnPolicyValue, 10) : undefined,
        };

        try {
            await addProduct(newProductData);
            toast({
                title: "Product Created",
                description: "The new product has been successfully created.",
            });
            router.push('/admin/products');
        } catch (error) {
            console.error("Failed to create product:", error);
            toast({
                title: "Error",
                description: "Failed to create the new product.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill in the details of the new product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {imageFiles.map((file, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <Image src={URL.createObjectURL(file)} alt={file.name} fill sizes="128px" className="object-cover rounded-md" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeImage(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground text-center">Click to upload</p>
                                        </div>
                                        <Input id="image-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" placeholder="e.g., Wireless Headphones" required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" placeholder="Describe the product" required disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="details">Product Details</Label>
                                <Textarea id="details" name="details" placeholder="Add detailed specifications or features" disabled={isLoading} />
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Discount Price</Label>
                                    <Input id="price" name="price" type="number" placeholder="e.g., 79" required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice">Original Price</Label>
                                    <Input id="originalPrice" name="originalPrice" type="number" placeholder="e.g., 99" disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Product Stock</Label>
                                    <Input id="stock" name="stock" type="number" placeholder="e.g., 50" required disabled={isLoading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={setCategory} required value={category} disabled={isLoading}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-4 border-t pt-4">
                                <Label className="text-base font-semibold">Settings</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="free-shipping" checked={freeShipping} onCheckedChange={(checked) => setFreeShipping(checked as boolean)} disabled={isLoading} />
                                    <label
                                        htmlFor="free-shipping"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Eligible for free shipping
                                    </label>
                                </div>
                                 <div className="flex flex-col gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="flash-sale" checked={isFlashSale} onCheckedChange={(checked) => setIsFlashSale(checked as boolean)} disabled={isLoading} />
                                        <label
                                            htmlFor="flash-sale"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Add to Flash Sale
                                        </label>
                                    </div>
                                    {isFlashSale && (
                                        <div className="space-y-4 ml-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="flash-sale-end-date">Flash Sale End Date</Label>
                                                <Input 
                                                    id="flash-sale-end-date" 
                                                    name="flashSaleEndDate" 
                                                    type="datetime-local" 
                                                    value={flashSaleEndDate}
                                                    onChange={(e) => setFlashSaleEndDate(e.target.value)}
                                                    required={isFlashSale} 
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="flash-sale-discount">Flash Sale Discount (%)</Label>
                                                <Input 
                                                    id="flash-sale-discount" 
                                                    name="flashSaleDiscount" 
                                                    type="number"
                                                    value={flashSaleDiscount || ''}
                                                    onChange={(e) => setFlashSaleDiscount(e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="e.g., 25"
                                                    required={isFlashSale}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="return-policy">Return Policy (in days)</Label>
                                    <Input id="return-policy" name="returnPolicy" type="number" placeholder="e.g., 30" disabled={isLoading} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Saving..." : "Save Product"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}

    

    