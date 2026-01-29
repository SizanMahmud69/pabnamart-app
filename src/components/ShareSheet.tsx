
"use client";

import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Copy, MoreHorizontal, ChevronRight, X, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link';

// Inline SVGs for brand icons
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 512 512" {...props}>
        <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"/>
    </svg>
);
const MessengerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="m12 2.01-8.52 5.09c-.83.49-1.48 1.6-1.48 2.61v7.29c0 1.54 1.25 2.79 2.79 2.79h14.42c1.54 0 2.79-1.25 2.79-2.79v-7.29c0-1.01-.65-2.12-1.48-2.61L12 2.01ZM10.88 13.57l3.39-4.32-3.4-4.32H5.13l3.4 4.32-3.4 4.32h5.74Zm2.24 0h5.74l-3.4-4.32 3.4-4.32h-5.74l-3.4 4.32 3.4 4.32Z"></path></svg>
);
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 448 512" fill="currentColor" {...props}><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 .2c34.9 0 67.7 13.5 92.8 38.6 25.1 25.1 38.6 58 38.6 92.8 0 98.2-79.9 178-178 178-31.8 0-62.1-8.4-88.6-23.4l-6.2-3.7-66.5 17.5 17.9-64.8-4.1-6.5c-16.2-26.4-24.6-56.5-24.6-88.1 0-98.2 79.9-178 178-178zm93.8 141.2c-2.4-1.2-14.3-7.1-16.5-7.9-2.2-.8-3.8-.8-5.4 1.2-1.6 2.1-6.2 7.9-7.6 9.5-1.4 1.6-2.8 1.8-5.2.6-2.4-1.2-10.3-3.8-19.5-12-7.2-6.4-12-14.3-13.4-16.8-1.4-2.5-.2-3.8.9-5.1 1-1.1 2.3-2.8 3.4-4.2s1.6-2.5 2.4-4.2c.8-1.6.4-3 .2-4.2s-5.4-13-7.4-17.8c-2-4.8-4-4.1-5.4-4.1h-4.8c-1.6 0-4.2.6-6.8 3.1-2.6 2.5-10.3 10-10.3 24.3s10.5 28.2 12 30.1c1.4 1.9 20.9 31.9 50.8 44.9 7.2 3.1 12.9 4.9 17.4 6.3 7.8 2.3 14.9 1.9 20.6 1.1 6.3-.8 19-7.8 21.7-15.3s2.7-14.1 1.9-15.3c-.8-1.2-2.4-1.9-4.8-3.1z"/></svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);
const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.13-.86 1.33-1.78.82l-4.76-3.52-2.26 2.16c-.25.25-.46.46-.9.46z"/></svg>
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
    
    const commissionAmount = product.affiliateCommission && product.price ? (product.price * product.affiliateCommission) / 100 : 0;

    const shareOptionsLine1 = [
        { name: 'Facebook', icon: FacebookIcon, color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
        { name: 'Messenger', icon: MessengerIcon, color: '#0099FF', href: `fb-messenger://share?link=${encodeURIComponent(shareUrl)}` },
        { name: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366', href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this product: ${product.name}\n${shareUrl}`)}` },
    ];
    
    const shareOptionsLine2 = [
        { name: 'Instagram', icon: InstagramIcon, isGradient: true, href: 'https://www.instagram.com' },
        { name: 'Telegram', icon: TelegramIcon, color: '#2AABEE', href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this product: ${product.name}`)}` },
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
                
                 <div className="flex justify-center mb-2">
                    <div className="relative w-24 h-24 bg-white rounded-lg p-2">
                        <img src={product.images[0]} alt={product.name} className="object-contain w-full h-full" />
                    </div>
                </div>
                
                <div className="mb-4">
                    {(() => {
                        if (appUser?.isAffiliate) {
                            if (commissionAmount > 0) {
                                return (
                                    <div className="p-3 text-center bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg shadow-lg">
                                        <p className="font-semibold text-base">You can earn <span className="font-bold">৳{commissionAmount.toFixed(2)}</span> by sharing this!</p>
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="p-3 text-center bg-gray-500 text-white rounded-lg shadow-lg">
                                        <p className="font-semibold text-base">This product is not eligible for commission.</p>
                                    </div>
                                );
                            }
                        } else {
                            return (
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
                            );
                        }
                    })()}
                </div>

                 <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        {shareOptionsLine1.map(({ name, icon: Icon, color, href }) => (
                            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 text-center text-xs">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <span>{name}</span>
                            </a>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                         {shareOptionsLine2.map(({ name, icon: Icon, color, href, isGradient }) => (
                            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 text-center text-xs">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isGradient ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : ''}`} style={!isGradient ? { backgroundColor: color } : {}}>
                                    <Icon className="h-6 w-6 text-white" style={name === 'Instagram' ? { stroke: 'white', fill: 'none' } : {}}/>
                                </div>
                                <span>{name}</span>
                            </a>
                        ))}
                        <button onClick={() => copyToClipboard(shareUrl, "Link Copied!")} className="flex flex-col items-center gap-1.5 text-center text-xs">
                             <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-500">
                                <Link2 className="h-6 w-6 text-white" />
                            </div>
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
