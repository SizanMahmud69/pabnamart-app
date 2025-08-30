
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const initialSettings = {
  mainLogo: '',
  bkashLogo: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/BKash_logo.svg',
  nagadLogo: 'https://pix1.wapkizfile.info/download/8a051c9b664e1f7de58fec071478a91c/sizan+wapkiz+click/nagad-logo-png-seeklogo-355240-(sizan.wapkiz.click).png',
  rocketLogo: 'https://picsum.photos/seed/rocket/100/60',
};

export default function SiteSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('siteSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
        setIsLoading(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            localStorage.setItem('siteSettings', JSON.stringify(settings));
            toast({
                title: "Settings Saved",
                description: "Your site settings have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive"
            });
        } finally {
            // Simulate a delay for better UX
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4">Loading settings...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <header className="py-4">
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Link>
                </Button>
            </header>
            <main>
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Settings</CardTitle>
                            <CardDescription>Manage your website's logos and branding.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            <div>
                                <h3 className="text-lg font-medium mb-2">Payment Gateway Logos</h3>
                                <Separator />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bkashLogo">bKash Logo URL</Label>
                                <Input 
                                    id="bkashLogo" 
                                    name="bkashLogo"
                                    value={settings.bkashLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nagadLogo">Nagad Logo URL</Label>
                                <Input 
                                    id="nagadLogo" 
                                    name="nagadLogo"
                                    value={settings.nagadLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rocketLogo">Rocket Logo URL</Label>
                                <Input 
                                    id="rocketLogo" 
                                    name="rocketLogo"
                                    value={settings.rocketLogo}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL" 
                                />
                            </div>
                             <p className="text-xs text-muted-foreground pt-4">
                                Note: After changing a logo URL, ensure the new image's domain is added to the `next.config.ts` file to prevent loading errors.
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
