
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Coins, Users, Search, TrendingUp, DollarSign } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const db = getFirestore(app);

export default function AdminCoinManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCoinsInCirculation = users.reduce((acc, user) => acc + (user.coins || 0), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Coins className="h-4 w-4" />
                                Coins in Circulation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalCoinsInCirculation}</div>
                            <p className="text-xs opacity-80 mt-1">Total coins held by all users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Estimated Value
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">৳{(totalCoinsInCirculation / 10).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total liability in Taka</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                Top Earner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold truncate">{users[0]?.displayName || 'N/A'}</div>
                            <p className="text-xs text-muted-foreground mt-1">{users[0]?.coins || 0} Coins</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Coin Rankings</CardTitle>
                        <CardDescription>Monitor coin balances across your user base.</CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or email..." 
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Coins</TableHead>
                                    <TableHead>Value (৳)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell>
                                            <div className="font-medium">{user.displayName}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Coins className="h-4 w-4 text-yellow-500" />
                                                <span className="font-bold">{user.coins || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>৳{((user.coins || 0) / 10).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/users/${user.uid}`}>View User</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
