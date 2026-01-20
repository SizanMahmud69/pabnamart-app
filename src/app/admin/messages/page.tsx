
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { ContactMessage } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const db = getFirestore(app);

const getStatusVariant = (status: ContactMessage['status']) => {
    switch (status) {
        case 'unread': return 'destructive';
        case 'read': return 'secondary';
        case 'replied': return 'default';
        default: return 'outline';
    }
};

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const messagesQuery = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
            setMessages(messagesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
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
                        <CardTitle>Inbox</CardTitle>
                        <CardDescription>View and manage messages from customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {messages.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>From</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {messages.map(message => (
                                        <TableRow 
                                            key={message.id} 
                                            onClick={() => router.push(`/admin/messages/${message.id}`)}
                                            className={cn("cursor-pointer", message.status === 'unread' && 'font-bold bg-muted/50')}
                                        >
                                            <TableCell>{message.name}</TableCell>
                                            <TableCell>{message.subject}</TableCell>
                                            <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(message.status)} className="capitalize">{message.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">Inbox is Empty</h3>
                                <p className="text-muted-foreground">You have no messages from customers yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
