
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, User, Mail, Calendar, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import type { ContactMessage } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { markMessageAsRead, replyToContactMessage } from '@/app/actions';
import { Separator } from '@/components/ui/separator';

const db = getFirestore(app);

export default function MessageDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const messageId = params.id as string;
    const { toast } = useToast();
    
    const [message, setMessage] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    useEffect(() => {
        if (!messageId) return;

        const messageRef = doc(db, 'contactMessages', messageId);
        const unsubscribe = onSnapshot(messageRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as ContactMessage;
                setMessage(data);
                if (data.status === 'unread') {
                    markMessageAsRead(messageId);
                }
            } else {
                toast({ title: "Error", description: "Message not found.", variant: "destructive" });
                router.replace('/admin/messages');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [messageId, router, toast]);

    const handleReply = async () => {
        if (!replyText.trim()) {
            toast({ title: "Reply cannot be empty.", variant: 'destructive' });
            return;
        }
        setIsReplying(true);
        const result = await replyToContactMessage(messageId, replyText);
        if (result.success) {
            toast({ title: "Reply Sent", description: "Your reply has been saved." });
            setReplyText('');
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
        setIsReplying(false);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!message) {
        return null;
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/messages">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Inbox
                    </Link>
                </Button>
            </header>
            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{message.subject}</CardTitle>
                        <CardDescription>Message from {message.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{message.name}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{message.email}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            {message.message}
                        </div>
                    </CardContent>
                </Card>

                {message.status === 'replied' && message.reply && (
                    <Card className="bg-primary/5">
                        <CardHeader>
                            <CardTitle>Your Reply</CardTitle>
                             <CardDescription>
                                Replied on {message.repliedAt ? new Date(message.repliedAt).toLocaleString() : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {message.reply}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {message.status !== 'replied' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reply to Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="reply-message">Your Reply</Label>
                                <Textarea 
                                    id="reply-message" 
                                    rows={6}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Replying to ${message.name}...`}
                                    disabled={isReplying}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleReply} disabled={isReplying}>
                                {isReplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Send className="mr-2 h-4 w-4" />
                                Send Reply
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </main>
        </div>
    );
}
