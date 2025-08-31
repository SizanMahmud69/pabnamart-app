
"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import type { Product, Category } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingSpinner from '@/components/LoadingSpinner';
import { collection, getFirestore, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';

const db = getFirestore(app);

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = Number(params.id);
    const { toast } = useToast();
    const { products, updateProduct } = useProducts();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [category, setCategory] = useState('');
    const [imageUrls, setImageUrls] = useState(['']);
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

    useEffect(() => {
        const productToEdit = products.find(p => p.id === productId);
        if (productToEdit) {
            setProduct(productToEdit);
            setCategory(productToEdit.category);
            setImageUrls(productToEdit.images.length > 0 ? productToEdit.images : ['']);
            setFreeShipping(productToEdit.freeShipping || false);
            setIsFlashSale(productToEdit.isFlashSale || false);
            setFlashSaleEndDate(productToEdit.flashSaleEndDate || '');
            setFlashSaleDiscount(productToEdit.flashSaleDiscount);
        }
    }, [products, productId]);

    const handleImageChange = (index: number, value: string) => {
        const newImageUrls = [...imageUrls];
        newImageUrls[index] = value;
        setImageUrls(newImageUrls);
    };

    const addImageUrlInput = () => {
        setImageUrls([...imageUrls, '']);
    };

    const removeImageUrlInput = (index: number) => {
        const newImageUrls = imageUrls.filter((_, i) => i !== index);
        setImageUrls(newImageUrls);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!product) return;
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        const finalImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
        if (finalImageUrls.length === 0) {
            finalImageUrls.push('https://picsum.photos/600/600');
        }

        const updatedProductData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'> = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseFloat(formData.get('price') as string),
            originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : undefined,
            stock: parseInt(formData.get('stock') as string, 10),
            category: category,
            images: finalImageUrls,
            details: formData.get('details') as string,
            freeShipping: freeShipping,
            isFlashSale: isFlashSale,
            flashSaleEndDate: isFlashSale ? flashSaleEndDate : '',
            flashSaleDiscount: isFlashSale ? flashSaleDiscount : undefined,
            returnPolicy: formData.get('returnPolicy') ? parseInt(formData.get('returnPolicy') as string, 10) : undefined,
        };

        try {
            await updateProduct(productId, updatedProductData);
            toast({
                title: "Product Updated",
                description: "The product has been successfully updated.",
            });
            router.push('/admin/products');
        } catch (error) {
            console.error("Failed to update product:", error);
            toast({
                title: "Error",
                description: "Failed to update the product.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!product) {
        return <LoadingSpinner />;
    }

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
                            <CardTitle>Edit Product</CardTitle>
                            <CardDescription>Update the details of the product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" defaultValue={product.name} required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={product.description} required disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="details">Product Details</Label>
                                <Textarea id="details" name="details" defaultValue={product.details} disabled={isLoading} />
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Discount Price</Label>
                                    <Input id="price" name="price" type="number" defaultValue={product.price} required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice">Original Price</Label>
                                    <Input id="originalPrice" name="originalPrice" type="number" defaultValue={product.originalPrice} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Product Stock</Label>
                                    <Input id="stock" name="stock" type="number" defaultValue={product.stock} required disabled={isLoading} />
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
                                    <Input id="return-policy" name="returnPolicy" type="number" defaultValue={product.returnPolicy} disabled={isLoading} />
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label>Image URLs</Label>
                                <div className="space-y-2">
                                    {imageUrls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                name={`image-${index}`}
                                                value={url}
                                                onChange={(e) => handleImageChange(index, e.target.value)}
                                                placeholder="https://example.com/image.png"
                                                disabled={isLoading}
                                            />
                                            {imageUrls.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removeImageUrlInput(index)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addImageUrlInput}
                                    className="mt-2"
                                    disabled={isLoading}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Image URL
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
