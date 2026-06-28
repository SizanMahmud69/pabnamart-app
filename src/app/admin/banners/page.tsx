
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Banner } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { PutBlobResult } from '@vercel/blob';

const db = getFirestore(app);

export default function BannerManagementPage() {
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const bannersRef = collection(db, 'banners');
        const q = query(bannersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
            setBanners(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            toast({ title: "Error", description: "Banner image is required.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let imageUrl = '';
        try {
            const response = await fetch(
                `/api/upload?filename=${imageFile.name}`,
                {
                  method: 'POST',
                  body: imageFile,
                },
              );
            
            if (!response.ok) {
                throw new Error('Failed to upload image.');
            }

            const newBlob = (await response.json()) as PutBlobResult;
            imageUrl = newBlob.url;

        } catch (error) {
            console.error("Image upload failed:", error);
            toast({
                title: "Upload Failed",
                description: "Could not upload banner image.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, 'banners'), {
                title,
                description,
                link,
                imageUrl,
                createdAt: new Date().toISOString(),
            });
            toast({ title: "Success", description: "Banner added successfully." });
            setTitle('');
            setDescription('');
            setLink('');
            setImageFile(null);
            if (inputFileRef.current) inputFileRef.current.value = '';
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to add banner.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBanner = async () => {
        if (!bannerToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'banners', bannerToDelete.id));
            toast({ title: "Success", description: "Banner deleted." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete banner.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setBannerToDelete(null);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Section */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add New Banner</CardTitle>
                        <CardDescription>Upload promotional banners for the homepage.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddBanner}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="image">Banner Image</Label>
                                <div className="aspect-video w-full">
                                    {imageFile ? (
                                        <div className="relative group h-full">
                                            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="object-cover w-full h-full rounded-md" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setImageFile(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor="banner-upload" className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground mt-2">Click to upload (800x400 recommended)</p>
                                            <Input id="banner-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" ref={inputFileRef} />
                                        </Label>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Summer Sale" required disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Up to 50% Off" disabled={isSubmitting} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="link">Redirect Link</Label>
                                <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="e.g., /category/Groceries" disabled={isSubmitting} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Add Banner
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* List Section */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing Banners</CardTitle>
                        <CardDescription>Manage currently active banners.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : banners.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {banners.map(banner => (
                                    <Card key={banner.id} className="overflow-hidden group relative">
                                        <div className="aspect-video relative bg-muted">
                                            <img src={banner.imageUrl} alt={banner.title} className="object-cover w-full h-full" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <AlertDialog onOpenChange={(open) => !open && setBannerToDelete(null)}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" onClick={() => setBannerToDelete(banner)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete this banner. This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeleteBanner} disabled={isDeleting}>
                                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="font-bold text-sm truncate">{banner.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{banner.description || 'No description'}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground mt-2">No banners added yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
