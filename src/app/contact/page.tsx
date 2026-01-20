
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import type { ContactSettings } from "@/types";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { saveContactMessage } from "@/app/actions";

type FormInputs = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

const db = getFirestore(app);

export default function ContactPage() {
    const [settings, setSettings] = useState<ContactSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormInputs>();
    const { toast } = useToast();

    useEffect(() => {
        const settingsDocRef = doc(db, 'settings', 'contact');
        const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as ContactSettings);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        const result = await saveContactMessage(data);
        if (result.success) {
            toast({
                title: "Message Sent!",
                description: "We'll get back to you as soon as possible.",
            });
            reset();
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };


    return (
        <div className="bg-purple-50/30 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                 <Button asChild variant="ghost" className="mb-4">
                    <Link href="/account">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>Get in touch with us through any of the following channels.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Phone className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">Phone</h3>
                                        {loading ? <Skeleton className="h-4 w-32" /> : <p className="text-muted-foreground">{settings?.phone || 'Not available'}</p>}
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center gap-4">
                                    <Mail className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">Email</h3>
                                         {loading ? <Skeleton className="h-4 w-48" /> : <p className="text-muted-foreground">{settings?.email || 'Not available'}</p>}
                                    </div>
                                </div>
                                 <Separator />
                                <div className="flex items-center gap-4">
                                    <MapPin className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">Address</h3>
                                         {loading ? (
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-56" />
                                            </div>
                                         ) : (
                                            <p className="text-muted-foreground">{settings?.address || 'Not available'}</p>
                                         )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                                <CardDescription>We'll get back to you as soon as possible.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input id="name" placeholder="Your Name" {...register("name", { required: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" placeholder="Your Email" {...register("email", { required: true })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" placeholder="Message Subject" {...register("subject", { required: true })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder="Your Message" rows={5} {...register("message", { required: true })} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    )
}
