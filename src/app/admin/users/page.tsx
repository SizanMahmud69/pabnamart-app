
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ban, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { User as AppUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteUserAccount } from '@/app/actions';

const db = getFirestore(app);

export default function AdminUserManagement() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const usersCollectionRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
            toast({ title: "Error", description: "Failed to fetch users.", variant: "destructive" });
        });

        return () => unsubscribe();
    }, [toast]);

    const handleBanUser = async (user: AppUser) => {
        const userDocRef = doc(db, 'users', user.uid);
        const newStatus = user.status === 'active' ? 'banned' : 'active';
        try {
            await updateDoc(userDocRef, { status: newStatus });
            toast({
                title: "User Status Updated",
                description: `${user.displayName}'s status has been changed to ${newStatus}.`
            });
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
        }
    };

    const confirmDeleteUser = () => {
        if (!userToDelete) return;

        startTransition(async () => {
            const result = await deleteUserAccount(userToDelete.uid);
            
            if (result.success) {
                toast({
                    title: "User Deleted",
                    description: `${userToDelete.displayName} has been permanently deleted.`
                });
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
            setUserToDelete(null);
        });
    };
    
    return (
        <>
            <div className="container mx-auto p-4">
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
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View and manage user accounts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Joined Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map(user => (
                                            <TableRow key={user.uid}>
                                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.joined ? new Date(user.joined).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>{user.status}</Badge>
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
                                                            <DropdownMenuItem onSelect={() => router.push(`/admin/users/${user.uid}`)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleBanUser(user)}>
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                {user.status === 'active' ? 'Ban User' : 'Unban User'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="text-destructive" 
                                                                onSelect={() => setUserToDelete(user)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Delete User</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{userToDelete?.displayName}</span> from Authentication and Firestore.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteUser} disabled={isPending}>
                            {isPending ? "Deleting..." : "Continue"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
