
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Category } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { PutBlobResult } from '@vercel/blob';

const db = getFirestore(app);

export default function CategorySettingsPage() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImageFile, setNewCategoryImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsLoading(true);
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewCategoryImageFile(e.target.files[0]);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim() || !newCategoryImageFile) {
            toast({ title: "Error", description: "Category name and image cannot be empty.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let imageUrl = '';
        try {
            const response = await fetch(
                `/api/upload?filename=${newCategoryImageFile.name}`,
                {
                  method: 'POST',
                  body: newCategoryImageFile,
                },
              );
            
            if (!response.ok) {
                throw new Error('Failed to upload image.');
            }

            const newBlob = (await response.json()) as PutBlobResult;
            imageUrl = newBlob.url;

        } catch (error) {
            console.error("Image upload failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Please check your network connection or browser extensions.";
            toast({
                title: "Image Upload Failed",
                description: `Could not upload category image. ${errorMessage}`,
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, 'categories'), {
                name: newCategoryName,
                image: imageUrl,
                createdAt: new Date().toISOString(),
            });
            toast({ title: "Success", description: "New category added." });
            setNewCategoryName('');
            setNewCategoryImageFile(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'categories', categoryToDelete.id));
            toast({ title: "Success", description: "Category deleted." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setCategoryToDelete(null);
        }
    };


    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Category</CardTitle>
                        <CardDescription>Create a new category for your products.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddCategory}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category-name">Category Name</Label>
                                    <Input
                                        id="category-name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="e.g., Home Appliances"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category Image</Label>
                                     <div className="aspect-square w-full">
                                        {newCategoryImageFile ? (
                                            <div className="relative group aspect-square">
                                                <img src={URL.createObjectURL(newCategoryImageFile)} alt="New category image" className="object-cover w-full h-full rounded-md" />
                                                <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => setNewCategoryImageFile(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                                <Upload className="w-8 h-8 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground text-center mb-1">Click to upload</p>
                                                <p className="text-xs text-muted-foreground">Max 4.5MB</p>
                                                <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" ref={inputFileRef} />
                                            </Label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Category
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Category Settings</CardTitle>
                        <CardDescription>View and delete existing categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Loading categories...</p>
                        ) : (
                            <ul className="space-y-2">
                                {categories.map(cat => (
                                    <li key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-4">
                                            {cat.image && (
                                                <div className="relative h-10 w-10 rounded-md overflow-hidden">
                                                    <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                                                </div>
                                            )}
                                            <span className="font-medium">{cat.name}</span>
                                        </div>
                                        <AlertDialog onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(cat)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the "{categoryToDelete?.name}" category. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteCategory} disabled={isDeleting}>
                                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        {isDeleting ? "Deleting..." : "Delete"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </li>
                                ))}
                            </ul>
                        )}
                         {categories.length === 0 && !isLoading && <p className="text-muted-foreground text-center">No categories found.</p>}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    