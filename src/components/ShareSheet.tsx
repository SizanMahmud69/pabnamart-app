"use client";

import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Copy, Link as LinkIcon, MessageSquare, MoreHorizontal, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link';

// Inline SVGs for brand icons
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M16.75 13.96c-.25.13-.5.25-.75.38-.5.25-1 .5-1.5.25-.5-.25-1-1-1.5-1.75s-.75-1.5-.5-2.25c.25-.75.75-1 .75-1.25s-.25-1-.25-1.25c-.25-.5-1-2.25-1.25-2.75s-.5-.5-.75-.5c-.25 0-.5 0-.75.01a.98.98 0 0 0-.75.38c-.25.25-.75.75-1 1.5-.25.75-.25 1.5 0 2.25.25.75.5 1.25 1 2s1 1.25 1.75 1.75c.75.5 1.5.75 2.25.75s1.25-.25 1.75-.5c.5-.25 1-1 1.25-1.5s.25-.75.25-1v-.25c-.01-.25-.01-.5-.25-.75zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path></svg>
);
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M17.6 3.1h-3.3c-3.5 0-5.8 2.3-5.8 5.9v2.5H6.2v3.7h2.3v9.3h4.1v-9.3h3.3l.5-3.7h-3.8V9.2c0-1.1.3-1.8 1.8-1.8h2V3.1z"/></svg>
);
const MessengerIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="m12 2.01-8.52 5.09c-.83.49-1.48 1.6-1.48 2.61v7.29c0 1.54 1.25 2.79 2.79 2.79h14.42c1.54 0 2.79-1.25 2.79-2.79v-7.29c0-1.01-.65-2.12-1.48-2.61L12 2.01Zm-1.12 11.56 3.39-4.32-3.4-4.32H5.13l3.4 4.32-3.4 4.32h5.74Zm2.24 0h5.74l-3.4-4.32 3.4-4.32h-5.74l-3.4 4.32 3.4 4.32Z"></path></svg>
);
const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M15 10l-4 4 6 6 6-16-18 7 4 2 2 6 3-4" /></svg>
);


interface ShareSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product;
    shareUrl: string;
}

export default function ShareSheet({ isOpen, onOpenChange, product, shareUrl }: ShareSheetProps) {
    const { toast } = useToast();
    const { appUser } = useAuth();

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: message });
        }).catch(err => {
            toast({
                title: "Error",
                description: "Could not copy to clipboard.",
                variant: "destructive",
            });
        });
    };

    const handleWebShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Check out this product: ${product.name}`,
                    url: shareUrl,
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            copyToClipboard(shareUrl, "Link Copied!");
        }
    }
    
    const commissionAmount = product.affiliateCommission && product.price ? (product.price * product.affiliateCommission) / 100 : 0;

    const shareOptions = [
        { name: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366', href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this product: ${product.name}\n${shareUrl}`)}` },
        { name: 'Facebook', icon: FacebookIcon, color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
        { name: 'Messenger', icon: MessengerIcon, color: '#0099FF', href: `fb-messenger://share?link=${encodeURIComponent(shareUrl)}` },
        { name: 'Telegram', icon: TelegramIcon, color: '#2AABEE', href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this product: ${product.name}`)}` },
    ];
    
    const actionOptions = [
        { name: 'Copy Info', icon: Copy, action: () => copyToClipboard(`${product.name}\n${shareUrl}`, "Product Info Copied!") },
        { name: 'Copy Link', icon: LinkIcon, action: () => copyToClipboard(shareUrl, "Link Copied!") },
        { name: 'Send SMS', icon: MessageSquare, action: () => { window.location.href = `sms:?body=${encodeURIComponent(`Check out this product: ${product.name}\n${shareUrl}`)}`; } },
        { name: 'More', icon: MoreHorizontal, action: handleWebShare },
    ];

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-lg max-h-[95vh] p-4 w-full sm:max-w-md mx-auto flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <span className="w-6"></span> {/* Spacer */}
                    <h2 className="text-base font-semibold text-center">Share this product with friends!</h2>
                    <SheetClose asChild>
                        <button className="text-muted-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </SheetClose>
                </div>
                
                <div className="relative w-full aspect-square mb-4 bg-white rounded-lg p-2">
                    <img src={product.images[0]} alt={product.name} className="object-contain w-full h-full" />
                </div>
                
                <div className="mb-4">
                    {appUser?.isAffiliate && commissionAmount > 0 ? (
                        <div className="p-3 text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg shadow-lg">
                            <p className="font-semibold text-base">You can earn <span className="font-bold">৳{commissionAmount.toFixed(2)}</span> by sharing this!</p>
                        </div>
                    ) : (
                        <Link href="/affiliate" className="block" onClick={() => onOpenChange(false)}>
                            <div className="p-3 text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg shadow-lg relative">
                                 <div className="border-2 border-white/30 rounded-md p-2">
                                    <p className="text-sm">Join PabnaMart Affiliate to earn by sharing!</p>
                                    <div className="flex items-center justify-center">
                                       <h3 className="font-bold text-lg">Join our Affiliate program now!</h3>
                                    </div>
                                    <p className="text-xs flex items-center justify-center">Read more <ChevronRight className="h-3 w-3 ml-0.5" /></p>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>


                <div className="grid grid-cols-4 gap-4 mb-6">
                   {shareOptions.map(({ name, icon: Icon, color, href }) => (
                        <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-center text-xs">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                                <Icon className="h-7 w-7 text-white" />
                            </div>
                            <span>{name}</span>
                        </a>
                    ))}
                </div>
                 <div className="grid grid-cols-4 gap-4">
                     {actionOptions.map(({ name, icon: Icon, action }) => (
                        <button key={name} onClick={action} className="flex flex-col items-center gap-2 text-center text-xs">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-muted">
                                <Icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span>{name}</span>
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}
