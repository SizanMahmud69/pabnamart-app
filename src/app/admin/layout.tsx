
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { LogOut, Settings, MessageSquare } from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, query, where, onSnapshot, getFirestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

const db = getFirestore(app);

function AdminHeader() {
    const router = useRouter();
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        const q = query(collection(db, 'contactMessages'), where('status', '==', 'unread'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadMessages(snapshot.size);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('isModerator');
        localStorage.removeItem('moderatorPermissions');
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/admin">
                    <span className="text-2xl font-bold text-primary whitespace-nowrap">PabnaMart</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon" className="relative">
                        <Link href="/admin/messages">
                            <MessageSquare className="h-6 w-6" />
                            {unreadMessages > 0 && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadMessages}</Badge>
                            )}
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/admin/settings">
                            <Settings className="h-6 w-6" />
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <LogOut className="h-6 w-6" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You will be returned to the login page.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </header>
    );
}


export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        const isModerator = localStorage.getItem('isModerator');
        if (isAdmin !== 'true' && isModerator !== 'true') {
            router.replace('/login');
        } else {
            setIsLoading(false);
        }
    }, [router]);
    
    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-slate-50 min-h-screen admin-layout-wrapper">
            <AdminHeader />
            {children}
        </div>
    );
}
