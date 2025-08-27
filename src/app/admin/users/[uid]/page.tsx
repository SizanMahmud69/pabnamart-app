
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User as UserIcon, Mail, Calendar, CheckCircle, XCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User as AppUser, Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const db = getFirestore(app);

// Mock order data for demonstration
const mockOrders: Order[] = [
  { id: '12345', customer: 'John Doe', date: '2023-10-26', total: 450, status: 'Delivered', userId: 'FakedUIDForJohnDoe' },
  { id: '12346', customer: 'Jane Smith', date: '2023-10-25', total: 250, status: 'Delivered', userId: 'FakedUIDForJaneSmith' },
  { id: '12347', customer: 'Mike Johnson', date: '2023-10-24', total: 150, status: 'Delivered', userId: 'FakedUIDForMikeJohnson' },
  { id: '12348', customer: 'John Doe', date: '2023-11-01', total: 300, status: 'Pending', userId: 'FakedUIDForJohnDoe' },
];


export default function UserDetailsPage() {
    const [user, setUser] = useState<AppUser | null>(null);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const params = useParams();
    const uid = params.uid as string;

    useEffect(() => {
        if (!uid) return;

        const fetchUserData = async () => {
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as AppUser;
                    setUser(userData);
                    
                    // Filter mock orders based on the user's name (since we don't have userId in mock data)
                    // In a real app, you'd query orders by `userId`.
                    const orders = mockOrders.filter(order => order.customer === userData.displayName);
                    setUserOrders(orders);

                } else {
                    toast({ title: "Error", description: "User not found.", variant: "destructive" });
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                toast({ title: "Error", description: "Failed to fetch user details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [uid, toast]);

    const completedOrders = userOrders.filter(order => order.status === 'Delivered').length;

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p>User not found.</p>
                <Button asChild variant="link">
                    <Link href="/admin/users">Back to User List</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4">
            <header className="py-4">
                <Button asChild variant="outline">
                    <Link href="/admin/users">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to User List
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                        <CardDescription>Details for {user.displayName}.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-semibold">{user.displayName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Joined Date</p>
                                <p className="font-semibold">{user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {user.status === 'active' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>{user.status}</Badge>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Completed Orders</p>
                                <p className="font-semibold">{completedOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                        <CardDescription>A list of all orders placed by this user.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userOrders.length > 0 ? (
                                    userOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>৳{order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">No orders found for this user.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
