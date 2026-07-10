
"use client";

import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, PlusCircle, Star, Trash2, MoreHorizontal, Loader2, ChevronRight, Zap, Truck, Gift, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Product, Category } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import { cn } from '@/lib/utils';

const db = getFirestore(app);

export default function AdminProductManagement() {
  const { products, deleteProduct } = useProducts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | 'All'>('All');
  const [selectedSubId, setSelectedSubId] = useState<string | 'All'>('All');
  
  const router = useRouter();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return () => unsubscribe();
  }, []);

  const mainCategories = useMemo(() => {
    return categories.filter(c => !c.parentId || c.parentId === 'none');
  }, [categories]);

  const subCategories = useMemo(() => {
    if (selectedParentId === 'All') return [];
    return categories.filter(c => c.parentId === selectedParentId);
  }, [categories, selectedParentId]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedParentId === 'All') return filtered;

    const parentCat = mainCategories.find(c => c.id === selectedParentId);
    if (!parentCat) return filtered;

    if (selectedSubId === 'All') {
        const validCategoryNames = [
            parentCat.name,
            ...categories.filter(c => c.parentId === selectedParentId).map(c => c.name)
        ];
        return filtered.filter(p => validCategoryNames.includes(p.category));
    } else {
        const subCat = categories.find(c => c.id === selectedSubId);
        return subCat ? filtered.filter(p => p.category === subCat.name) : filtered;
    }
  }, [products, selectedParentId, selectedSubId, categories, mainCategories]);

  const getProductCategoryDisplay = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    if (cat && cat.parentId && cat.parentId !== 'none') {
        const parent = categories.find(c => c.id === cat.parentId);
        return parent ? (
            <div className="flex items-center gap-1 text-[10px]">
                <span className="text-muted-foreground truncate max-w-[60px]">{parent.name}</span>
                <ChevronRight className="h-2 w-2 text-muted-foreground" />
                <span className="font-semibold text-primary truncate max-w-[80px]">{cat.name}</span>
            </div>
        ) : categoryName;
    }
    return <span className="font-medium text-xs">{categoryName}</span>;
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
        await deleteProduct(productToDelete.id);
        toast({ title: "Product Deleted", description: `"${productToDelete.name}" has been successfully deleted.` });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
    }
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-7xl">
          <header className="py-4 flex justify-between items-center">
              <Button asChild variant="outline" size="sm">
                  <Link href="/admin">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                  </Link>
              </Button>
              <Button asChild size="sm">
                  <Link href="/admin/products/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Product
                  </Link>
              </Button>
          </header>
          <main>
              <Card>
                  <CardHeader>
                      <CardTitle className="text-2xl">Product Management</CardTitle>
                      <CardDescription>View, edit, or delete your store products with full details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Categories Filter */}
                    <div className="space-y-4">
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border p-2">
                            <div className="flex w-max space-x-2">
                                <Button
                                    variant={selectedParentId === 'All' ? "default" : "outline"}
                                    onClick={() => { setSelectedParentId('All'); setSelectedSubId('All'); }}
                                    size="sm"
                                    className="rounded-full px-6"
                                >
                                    All Categories
                                </Button>
                                {mainCategories.map(cat => (
                                    <Button
                                        key={cat.id}
                                        variant={selectedParentId === cat.id ? "default" : "outline"}
                                        onClick={() => { setSelectedParentId(cat.id); setSelectedSubId('All'); }}
                                        size="sm"
                                        className="rounded-full px-6"
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* Sub-categories Filter Row */}
                        {selectedParentId !== 'All' && subCategories.length > 0 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <ScrollArea className="w-full whitespace-nowrap rounded-md border p-2 bg-muted/20">
                                    <div className="flex w-max space-x-2">
                                        <Button
                                            variant={selectedSubId === 'All' ? "secondary" : "ghost"}
                                            onClick={() => setSelectedSubId('All')}
                                            size="sm"
                                            className="rounded-full px-4"
                                        >
                                            All in {mainCategories.find(c => c.id === selectedParentId)?.name}
                                        </Button>
                                        {subCategories.map(sub => (
                                            <Button
                                                key={sub.id}
                                                variant={selectedSubId === sub.id ? "default" : "outline"}
                                                onClick={() => setSelectedSubId(sub.id)}
                                                size="sm"
                                                className="rounded-full px-4"
                                            >
                                                {sub.name}
                                            </Button>
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                      <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead className="min-w-[200px]">Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-center">Sold</TableHead>
                                    <TableHead className="text-center">Rating</TableHead>
                                    <TableHead className="text-center">B1G1</TableHead>
                                    <TableHead className="text-center">Flash</TableHead>
                                    <TableHead className="text-center">Ship</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => {
                                    const defaultImage = "https://i.ibb.co/gV28rC7/default-image.jpg";
                                    let imageUrl = product.images?.[0] || defaultImage;

                                    return (
                                    <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-white shadow-sm">
                                                <img src={imageUrl} alt={product.name} className="object-cover w-full h-full" loading="lazy" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm leading-tight line-clamp-1">{product.name}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1">ID: {product.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getProductCategoryDisplay(product.category)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-sm">৳{product.price}</div>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <div className="text-[10px] text-muted-foreground line-through">৳{product.originalPrice}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}
                                                className="h-5 px-2 text-[10px]"
                                            >
                                                {product.stock}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm font-medium">{product.sold || 0}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="h-3 w-3 fill-accent text-accent" />
                                                <span className="text-xs font-bold">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {product.isB1G1 ? (
                                                <Badge className="bg-pink-100 text-pink-700 border-pink-200 h-5 px-1.5"><Gift className="h-3 w-3 mr-0.5" />Yes</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-[10px]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {product.isFlashSale ? (
                                                (() => {
                                                    const isExpired = product.flashSaleEndDate && new Date(product.flashSaleEndDate) < new Date();
                                                    return isExpired ? (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-destructive text-destructive bg-destructive/5 font-bold">
                                                            <Clock className="h-2.5 w-2.5 mr-0.5" />End
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 h-5 px-1.5">
                                                            <Zap className="h-3 w-3 mr-0.5" />On
                                                        </Badge>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-muted-foreground text-[10px]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {product.freeShipping ? (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 h-5 px-1.5"><Truck className="h-3 w-3 mr-0.5" />Free</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-[10px]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => router.push(`/admin/products/edit/${product.id}`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive" 
                                                        onSelect={() => setProductToDelete(product)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )})}
                                {filteredProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={11} className="h-40 text-center text-muted-foreground">
                                            No products found in this category.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                      </div>
                  </CardContent>
              </Card>
          </main>
      </div>
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete <span className="font-bold">{productToDelete?.name}</span>. This action cannot be undone.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
