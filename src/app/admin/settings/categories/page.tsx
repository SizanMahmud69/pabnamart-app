
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Category } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const db = getFirestore(app);

const iconOptions = ["Shirt", "Heart", "ShoppingBasket", "Smartphone", "Tv2", "Laptop"];
const colorOptions = [
    { name: "Blue", value: "bg-blue-100 text-blue-600" },
    { name: "Purple", value: "bg-purple-100 text-purple-600" },
    { name: "Pink", value: "bg-pink-100 text-pink-600" },
    { name: "Green", value: "bg-green-100 text-green-600" },
    { name: "Cyan", value: "bg-cyan-100 text-cyan-600" },
    { name: "Indigo", value: "bg-indigo-100 text-indigo-600" }
];


export default function CategorySettingsPage() {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'categories'), {
                name: newCategoryName,
                icon: iconOptions[Math.floor(Math.random() * iconOptions.length)],
                color: colorOptions[Math.floor(Math.random() * colorOptions.length)].value,
            });
            toast({ title: "Success", description: "New category added." });
            setNewCategoryName('');
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteDoc(doc(db, 'categories', categoryToDelete.id));
            toast({ title: "Success", description: "Category deleted." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
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
                        <CardContent>
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
                        <CardTitle>Manage Categories</CardTitle>
                        <CardDescription>View and delete existing categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Loading categories...</p>
                        ) : (
                            <ul className="space-y-2">
                                {categories.map(cat => (
                                    <li key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <span className="font-medium">{cat.name}</span>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the "{cat.name}" category. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteCategory()}>Delete</AlertDialogAction>
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
