
"use client";

import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, PlusCircle, Star, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

const CATEGORY_ORDER = [
    "Men's Fashion",
    "Women's Fashion",
    "Cosmetics",
    "Groceries",
    "Mobile & Computers",
    "Electronics",
];

export default function AdminProductManagement() {
  const { products, deleteProduct } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();

  const categories = useMemo(() => {
    const existingCategories = Array.from(new Set(products.map(p => p.category)));
    const sortedCategories = CATEGORY_ORDER.filter(cat => existingCategories.includes(cat));
    // Add any categories from products that are not in the predefined order
    existingCategories.forEach(cat => {
        if (!sortedCategories.includes(cat)) {
            sortedCategories.push(cat);
        }
    });
    return ['All', ...sortedCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);


  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="container mx-auto p-4">
        <header className="py-4 flex justify-between items-center">
            <Button asChild variant="outline" size="xs">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <Button asChild size="xs">
                <Link href="/admin/products/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Product
                </Link>
            </Button>
        </header>
        <main>
            <Card>
                <CardHeader>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>View, edit, or delete your store products.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                        <ScrollArea className="w-full whitespace-nowrap rounded-md">
                            <TabsList className="inline-flex w-max mb-4">
                                {categories.map(category => (
                                    <TabsTrigger key={category} value={category}>
                                        {category}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        <TabsContent value={selectedCategory}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Original Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint="product image" />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell>৳{product.price.toFixed(2)}</TableCell>
                                            <TableCell>{product.originalPrice ? `৳${product.originalPrice.toFixed(2)}` : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'secondary' : 'destructive'}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 text-accent fill-accent" />
                                                    {product.rating.toFixed(1)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
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
                                                            onSelect={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
