
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Coins, Users, Search, TrendingUp, DollarSign, Loader2, Save, Settings } from 'lucide-react';
import { getFirestore, collection, query, orderBy, onSnapshot, limit, doc, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User, CoinSettings } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

const initialSettings: CoinSettings = {
    checkInPoints: 1,
    reviewPoints: 20,
    pointsPer100Taka: 10,
    takaPer100Coins: 10,
    maxCoinsPerOrder: 100,
};

export default function AdminCoinManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [settings, setSettings] = useState<CoinSettings>(initialSettings);
    const { toast } = useToast();

    useEffect(() => {
        // Fetch Settings
        const settingsRef = doc(db, 'settings', 'coin');
        const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings({ ...initialSettings, ...docSnap.data() });
            }
        });

        // Fetch Top Earners
        const q = query(collection(db, 'users'), orderBy('coins', 'desc'), limit(50));
        const unsubUsers = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(data);
            setLoading(false);
        });

        return () => {
            unsubSettings();
            unsubUsers();
        };
    }, []);

    const handleSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'coin'), settings);
            toast({ title: "Settings Saved", description: "Coin system configuration updated." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const filteredUsers = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCoinsInCirculation = users.reduce((acc, user) => acc + (user.coins || 0), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <header className="py-2">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>

            <main className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Settings Form */}
                    <Card className="md:row-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Coin Configuration
                            </CardTitle>
                            <CardDescription>Adjust how coins are earned and spent.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSettingsSave}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reviewPoints">Points per Review</Label>
                                    <Input id="reviewPoints" name="reviewPoints" type="number" value={settings.reviewPoints} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkInPoints">Daily Check-in Points</Label>
                                    <Input id="checkInPoints" name="checkInPoints" type="number" value={settings.checkInPoints} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPer100Taka">Points per ৳100 Purchase</Label>
                                    <Input id="pointsPer100Taka" name="pointsPer100Taka" type="number" value={settings.pointsPer100Taka} onChange={handleInputChange} />
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="takaPer100Coins">Value of 100 Coins (৳)</Label>
                                    <Input id="takaPer100Coins" name="takaPer100Coins" type="number" value={settings.takaPer100Coins} onChange={handleInputChange} />
                                    <p className="text-[10px] text-muted-foreground">Current: 1 Coin = ৳{(settings.takaPer100Coins / 100).toFixed(2)}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxCoinsPerOrder">Max Coins Usage per Order</Label>
                                    <Input id="maxCoinsPerOrder" name="maxCoinsPerOrder" type="number" value={settings.maxCoinsPerOrder} onChange={handleInputChange} />
                                    <p className="text-[10px] text-muted-foreground">Approx. ৳{(settings.maxCoinsPerOrder * (settings.takaPer100Coins / 100)).toFixed(2)} discount max.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Configuration
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Stats */}
                    <div className="space-y-6">
                        <Card className="bg-primary text-primary-foreground">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Coins className="h-4 w-4" />
                                    Coins in Circulation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{totalCoinsInCirculation}</div>
                                <p className="text-xs opacity-80 mt-1">Held by monitored top users</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    Liability Value
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">৳{(totalCoinsInCirculation * (settings.takaPer100Coins / 100)).toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Total potential discount cost</p>
                            </CardContent>
                    </div>
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
                                            <div className="font-medium text-xs sm:text-sm">{user.displayName}</div>
                                            <div className="text-[10px] sm:text-xs text-muted-foreground">{user.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                                <span className="font-bold">{user.coins || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs sm:text-sm">৳{((user.coins || 0) * (settings.takaPer100Coins / 100)).toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild className="h-8 text-[10px] sm:text-xs">
                                                <Link href={`/admin/users/${user.uid}`}>View</Link>
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
