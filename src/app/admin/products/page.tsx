
"use client";

import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, PlusCircle, Star, Trash2, MoreHorizontal, Loader2, ChevronRight } from 'lucide-react';
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
        // Show parent category products OR any of its sub-category products
        const validCategoryNames = [
            parentCat.name,
            ...categories.filter(c => c.parentId === selectedParentId).map(c => c.name)
        ];
        return filtered.filter(p => validCategoryNames.includes(p.category));
    } else {
        // Show only products from specific sub-category
        const subCat = categories.find(c => c.id === selectedSubId);
        return subCat ? filtered.filter(p => p.category === subCat.name) : filtered;
    }
  }, [products, selectedParentId, selectedSubId, categories, mainCategories]);

  const getProductCategoryDisplay = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);
    if (cat && cat.parentId && cat.parentId !== 'none') {
        const parent = categories.find(c => c.id === cat.parentId);
        return parent ? (
            <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{parent.name}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-primary">{cat.name}</span>
            </div>
        ) : categoryName;
    }
    return <span className="font-medium">{categoryName}</span>;
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
      <div className="container mx-auto p-4">
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
                      <CardDescription>View, edit, or delete your store products.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Main Categories Filter */}
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border p-2">
                        <div className="flex w-max space-x-2">
                            <Button
                                variant={selectedParentId === 'All' ? "default" : "outline"}
                                onClick={() => { setSelectedParentId('All'); setSelectedSubId('All'); }}
                                size="sm"
                                className="rounded-full px-6"
                            >
                                All
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

                    {/* Sub-categories Filter Row (Visible only if parent is selected) */}
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

                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Image</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Stock</TableHead>
                                  <TableHead>B1G1</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredProducts.map(product => {
                                const defaultImage = "https://i.ibb.co/gV28rC7/default-image.jpg";
                                let imageUrl = product.images?.[0] || defaultImage;

                                return (
                                  <TableRow key={product.id}>
                                      <TableCell>
                                          <div className="relative h-10 w-10 rounded-md overflow-hidden">
                                            <img src={imageUrl} alt={product.name} className="object-cover w-full h-full" loading="lazy" />
                                          </div>
                                      </TableCell>
                                      <TableCell className="font-medium">{product.name}</TableCell>
                                      <TableCell>
                                          {getProductCategoryDisplay(product.category)}
                                      </TableCell>
                                      <TableCell>৳{product.price}</TableCell>
                                      <TableCell>
                                          <Badge variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}>
                                              {product.stock}
                                          </Badge>
                                      </TableCell>
                                      <TableCell>
                                          {product.isB1G1 ? (
                                              <Badge className="bg-pink-100 text-pink-700 border-pink-200">Yes</Badge>
                                          ) : (
                                              <span className="text-muted-foreground text-xs">No</span>
                                          )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                                      <MoreHorizontal className="h-4 w-4" />
                                                  </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                  <DropdownMenuItem onSelect={() => router.push(`/admin/products/edit/${product.id}`)}>
                                                      <Edit className="mr-2 h-4 w-4" />
                                                      <span>Edit</span>
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem 
                                                      className="text-destructive" 
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
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </main>
      </div>
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently delete <span className="font-bold">{productToDelete?.name}</span>.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
