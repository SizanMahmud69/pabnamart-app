
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreHorizontal, Eye, Ban, CheckCircle, Truck, RefreshCw, XCircle, User, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, runTransaction, increment } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { Order, Product } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '@/app/actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatQuantity, formatMoney } from '@/lib/utils';


const db = getFirestore(app);

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'processing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': return 'default';
        case 'cancelled': return 'destructive';
        case 'returned': return 'destructive';
        default: return 'outline';
    }
};

const statusTabs: Order['status'][] = ['processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const allStatusTabs = ['all', ...statusTabs];


export default function AdminQuickOrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();
    const router = useRouter();

    // Delete States
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    useEffect(() => {
        const ordersQuery = query(collection(db, 'orders'), orderBy('date', 'desc'));
        const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            // Filter ONLY guest orders
            const guestOrders = ordersData.filter(order => order.userId.startsWith('guest_'));
            
            setOrders(guestOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => ordersUnsubscribe();
    }, []);

    const getAvailableStatuses = (currentStatus: Order['status']): Order['status'][] => {
        switch (currentStatus) {
            case 'pending':
                return ['processing', 'cancelled'];
            case 'processing':
                return ['shipped', 'cancelled'];
            case 'shipped':
                return ['delivered'];
            case 'delivered':
                return ['returned'];
            default:
                return [];
        }
    };

    const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
        const result = await updateOrderStatus(order.id, newStatus);
        
        if (result.success) {
            toast({
                title: "Order Status Updated",
                description: `Quick Order has been marked as ${newStatus}.`
            });
        } else {
            toast({
                title: "Error",
                description: result.message || "Failed to update order status.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        try {
            await runTransaction(db, async (transaction) => {
                // Restore stock if the order was not already cancelled or returned
                if (!['cancelled', 'returned', 'return-denied'].includes(orderToDelete.status)) {
                    for (const item of orderToDelete.items) {
                        const productRef = doc(db, 'products', item.id.toString());
                        const productSnap = await transaction.get(productRef);
                        
                        if (productSnap.exists()) {
                            const productData = productSnap.data() as Product;
                            let newColors = [...(productData.colors || [])];
                            let newSizes = [...(productData.sizes || [])];

                            if (item.color) {
                                const idx = newColors.findIndex(c => c.name === item.color);
                                if (idx !== -1) newColors[idx].stock += item.quantity;
                            }
                            if (item.size) {
                                const idx = newSizes.findIndex(s => s.name === item.size);
                                if (idx !== -1) newSizes[idx].stock += item.quantity;
                            }

                            transaction.update(productRef, {
                                stock: increment(item.quantity),
                                sold: increment(-item.quantity),
                                colors: newColors,
                                sizes: newSizes
                            });
                        }
                    }
                }
                // Finally delete the order document
                transaction.delete(doc(db, 'orders', orderToDelete.id));
            });

            toast({
                title: "Order Deleted",
                description: `Quick Order #${orderToDelete.orderNumber} has been permanently deleted and stock restored.`
            });
        } catch (error) {
            console.error("Delete failed:", error);
            toast({
                title: "Error",
                description: "Failed to delete quick order and restore stock.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
            setOrderToDelete(null);
        }
    };
    
    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') {
            return orders.filter(order => order.status !== 'pending');
        }
        return orders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <div className="container mx-auto p-4 max-w-4xl">
                <header className="py-4">
                    <Button asChild variant="outline">
                        <Link href="/admin">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </header>
                <main>
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Order Management</CardTitle>
                            <CardDescription>View and manage orders placed by guest (unregistered) users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                                <div className="flex w-max space-x-2 p-2">
                                    {allStatusTabs.map(tab => (
                                        <Button
                                            key={tab}
                                            variant={activeTab === tab ? "default" : "outline"}
                                            onClick={() => setActiveTab(tab)}
                                            size="sm"
                                            className="capitalize"
                                        >
                                            {tab}
                                        </Button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>

                            <div className="mt-4">
                            {filteredOrders.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredOrders.map(order => {
                                            const nextStatuses = getAvailableStatuses(order.status);
                                            return (
                                            <Card key={order.id} className="shadow-md border-orange-200">
                                                <CardHeader className="flex flex-row items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1.5 mt-1">
                                                            <User className="h-3.5 w-3.5" />
                                                            <span className="font-bold text-foreground">{order.shippingAddress.fullName}</span>
                                                            <span className="mx-1">•</span>
                                                            <span>{new Date(order.date).toLocaleString()}</span>
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onSelect={() => router.push(`/admin/orders/${order.id}`)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    <span>View Details</span>
                                                                </DropdownMenuItem>
                                                                {nextStatuses.length > 0 && (
                                                                    <DropdownMenuSub>
                                                                        <DropdownMenuSubTrigger>
                                                                            <span>Change Status</span>
                                                                        </DropdownMenuSubTrigger>
                                                                        <DropdownMenuPortal>
                                                                            <DropdownMenuSubContent>
                                                                                {nextStatuses.map(status => (
                                                                                    <DropdownMenuItem key={status} onSelect={() => handleStatusChange(order, status)} className="capitalize">
                                                                                        {status}
                                                                                    </DropdownMenuItem>
                                                                                ))}
                                                                            </DropdownMenuSubContent>
                                                                        </DropdownMenuPortal>
                                                                    </DropdownMenuSub>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                                    onSelect={() => setOrderToDelete(order)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>Delete Order</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    {order.items.map((item, index) => {
                                                        return (
                                                        <div key={`${item.id}-${index}`} className="flex items-center gap-4 py-2">
                                                            <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover border" />
                                                            <div className="flex-grow">
                                                                <p className="font-semibold text-sm">{item.name}</p>
                                                                {(item.color || item.size) && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.color}{item.color && item.size ? ', ' : ''}{item.size}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground">Qty: {formatQuantity(item.quantity)} {item.unit || 'Pcs'}</p>
                                                            </div>
                                                            <p className="font-semibold text-sm">৳{formatMoney(item.price * item.quantity)}</p>
                                                        </div>
                                                    )})}
                                                    <div className="bg-muted/30 p-2 rounded-md mt-2 text-xs">
                                                        <p><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                                                        <p><strong>Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.area}, {order.shippingAddress.city}</p>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                                                    <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                                        <p className="text-xl font-bold">৳{formatMoney(order.total)}</p>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        )})}
                                    </div>
                            ) : (
                                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No guest orders found for this status.</p>
                                    </div>
                            )}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>

            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete quick order #{orderToDelete?.orderNumber}. Stock will be automatically restored to the products. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOrder} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
