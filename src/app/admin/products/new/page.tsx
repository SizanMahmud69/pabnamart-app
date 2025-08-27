
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = [
  "Men's Fashion",
  "Women's Fashion",
  "Cosmetics",
  "Groceries",
  "Mobile & Computers",
  "Electronics",
];

export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { addProduct } = useProducts();
    const [isLoading, setIsLoading] = useState(false);
    const [category, setCategory] = useState('');
    const [imageUrls, setImageUrls] = useState(['']);

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
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        
        const finalImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
        if (finalImageUrls.length === 0) {
            finalImageUrls.push('https://picsum.photos/600/600');
        }

        const newProductData: Omit<Product, 'id'> = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseFloat(formData.get('price') as string),
            originalPrice: formData.get('discount') ? parseFloat(formData.get('discount') as string) : undefined,
            stock: parseInt(formData.get('stock') as string, 10),
            category: category,
            images: finalImageUrls,
            rating: 0,
            reviews: [],
            details: formData.get('details') as string,
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
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" placeholder="e.g., Wireless Headphones" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" placeholder="Describe the product" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="details">Product Details</Label>
                                <Textarea id="details" name="details" placeholder="Add detailed specifications or features" />
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (৳)</Label>
                                    <Input id="price" name="price" type="number" placeholder="e.g., 99" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount (৳)</Label>
                                    <Input id="discount" name="discount" type="number" placeholder="e.g., 79" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input id="stock" name="stock" type="number" placeholder="e.g., 50" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={setCategory} required value={category}>
                                    <SelectTrigger id="category">
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
                                <Label>Image URLs</Label>
                                <div className="space-y-2">
                                    {imageUrls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                name={`image-${index}`}
                                                value={url}
                                                onChange={(e) => handleImageChange(index, e.target.value)}
                                                placeholder="https://example.com/image.png"
                                            />
                                            {imageUrls.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removeImageUrlInput(index)}
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
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Image URL
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Product"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
