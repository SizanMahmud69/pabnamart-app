
"use client";

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CreditCard, Download, Smartphone, Loader2, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { formatQuantity, formatMoney } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'pending': return 'secondary';
        case 'processing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': return 'default';
        case 'cancelled': return 'destructive';
        case 'returned': return 'destructive';
        case 'return-requested': return 'secondary';
        case 'return-approved': return 'default';
        case 'return-shipped': return 'default';
        case 'return-denied': return 'destructive';
        default: return 'outline';
    }
};

const PrintableInvoice = ({ 
    order, 
    subtotal, 
    voucherDiscount, 
    coinDiscount, 
    spinDiscount 
}: { 
    order: Order, 
    subtotal: number, 
    voucherDiscount: number,
    coinDiscount: number,
    spinDiscount: number
}) => {
    const isPaid = order.paymentMethod !== 'cash-on-delivery';
    const stampText = isPaid ? 'PAID' : 'UNPAID';
    const stampClass = isPaid ? 'paid' : 'unpaid';
    
    return (
        <div className="invoice-container-pdf">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                .invoice-container-pdf {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0;
                    background: white;
                    position: relative;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    box-sizing: border-box;
                    color: #0f172a;
                    display: flex;
                    flex-direction: column;
                }
                .brand-border {
                    position: absolute;
                    inset: 10mm;
                    border: 1px solid rgba(139, 92, 246, 0.1);
                    pointer-events: none;
                    z-index: 0;
                }
                .brand-border::before {
                    content: 'pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart';
                    position: absolute;
                    top: -7px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 7px;
                    font-weight: 800;
                    color: #8b5cf6;
                    text-transform: uppercase;
                    background: white;
                    padding: 0 10px;
                    letter-spacing: 4px;
                    white-space: nowrap;
                    opacity: 0.4;
                }
                .brand-border::after {
                    content: 'pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart';
                    position: absolute;
                    bottom: -7px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 7px;
                    font-weight: 800;
                    color: #8b5cf6;
                    text-transform: uppercase;
                    background: white;
                    padding: 0 10px;
                    letter-spacing: 4px;
                    white-space: nowrap;
                    opacity: 0.4;
                }
                
                .header { text-align: center; margin-bottom: 35px; position: relative; z-index: 10; }
                .header h1 { font-size: 42px; font-weight: 900; color: #8b5cf6; margin: 0; letter-spacing: -1.5px; }
                .header p { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 6px; margin-top: 5px; }
                
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 35px; position: relative; z-index: 10; }
                .info-section { width: 45%; }
                .info-section h3 { font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; font-weight: 800; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; letter-spacing: 1.5px; }
                .info-section p { margin: 2px 0; font-size: 12px; line-height: 1.5; color: #334155; }
                .info-section .highlight { font-weight: 700; color: #0f172a; }
                .text-right { text-align: right; }
                
                .payment-info-bar { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    padding: 10px 20px; 
                    border-radius: 10px; 
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative; z-index: 10;
                }
                .payment-info-bar div { font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
                .payment-info-bar span { color: #0f172a; font-family: monospace; font-size: 12px; margin-left: 6px; font-weight: 600; }

                .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 10; }
                .table th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 800; color: #475569; border-bottom: 2px solid #e2e8f0; letter-spacing: 1px; }
                .table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: middle; }
                .item-name { font-weight: 700; color: #0f172a; font-size: 13px; }
                .item-meta { font-size: 9px; color: #64748b; margin-top: 3px; font-weight: 600; text-transform: uppercase; }
                .b1g1-badge { font-size: 8px; font-weight: 900; background: #fff1f2; color: #e11d48; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecdd3; margin-left: 8px; vertical-align: middle; }
                
                .bottom-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; position: relative; z-index: 10; }
                .stamp { 
                    border: 4px double; 
                    padding: 10px 20px; 
                    text-align: center; 
                    transform: rotate(-12deg); 
                    opacity: 0.12; 
                    border-radius: 12px; 
                    margin-top: 25px;
                }
                .stamp-main { font-size: 38px; font-weight: 900; letter-spacing: 1px; }
                .stamp-sub { font-size: 8px; font-weight: 800; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
                .stamp.paid { color: #059669; border-color: #059669; }
                .stamp.unpaid { color: #e11d48; border-color: #e11d48; }
                
                .totals-card { width: 280px; background: #fdfdfd; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
                .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; font-weight: 500; color: #475569; }
                .totals-row.voucher-discount { color: #059669; font-weight: 700; }
                .totals-row.coin-discount { color: #ca8a04; font-weight: 700; }
                .totals-row.spin-discount { color: #4f46e5; font-weight: 700; }
                .totals-row.grand { 
                    font-size: 24px; 
                    font-weight: 900; 
                    color: #0f172a; 
                    border-top: 2px solid #0f172a; 
                    margin-top: 12px; 
                    padding-top: 12px; 
                    letter-spacing: -0.5px;
                }
                
                .footer { margin-top: auto; text-align: center; padding-top: 30px; position: relative; z-index: 10; }
                .footer p { margin: 3px 0; font-size: 10px; color: #94a3b8; font-weight: 500; }
                .footer .tagline { font-weight: 800; color: #1e293b; font-size: 14px; margin-bottom: 6px; letter-spacing: -0.3px; }
            `}</style>

            <div className="brand-border"></div>

            <div className="header">
                <h1>PabnaMart</h1>
                <p>Digital Purchase Receipt</p>
            </div>

            <div className="info-grid">
                <div className="info-section">
                    <h3>Order Record</h3>
                    <p>ID: <span className="highlight">#{order.orderNumber}</span></p>
                    <p>Issued: {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Status: <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{order.status.replace('-', ' ')}</span></p>
                </div>
                <div className="info-section text-right">
                    <h3>Recipient</h3>
                    <p className="highlight">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.area}, {order.shippingAddress.city}</p>
                    <p>Contact: {order.shippingAddress.phone}</p>
                </div>
            </div>

            <div className="payment-info-bar">
                <div>METHOD: <span>{order.paymentMethod.replace('-', ' ').toUpperCase()}</span></div>
                {isPaid && order.transactionId && <div>TRX: <span>{order.transactionId}</span></div>}
                {isPaid && order.paymentAccountNumber && <div>SOURCE: <span>{order.paymentAccountNumber}</span></div>}
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '60%' }}>Product Description</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <span className="item-name">{item.name}</span>
                                {item.isB1G1 && <span className="b1g1-badge">B1G1</span>}
                                <div className="item-meta">
                                    {item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'Standard Edition'}
                                </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{formatQuantity(item.quantity)} {item.unit}</td>
                            <td style={{ textAlign: 'right' }}>৳{formatMoney(item.price)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>৳{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="bottom-flex">
                <div className={`stamp ${stampClass}`}>
                    <div className="stamp-main">{stampText}</div>
                    <div className="stamp-sub">Verified by PabnaMart</div>
                </div>
                
                <div className="totals-card">
                    <div className="totals-row">
                        <span>Subtotal:</span>
                        <span>৳{formatMoney(subtotal)}</span>
                    </div>
                    {voucherDiscount > 0 && (
                        <div className="totals-row voucher-discount">
                            <span>Voucher Applied:</span>
                            <span>- ৳{formatMoney(voucherDiscount)}</span>
                        </div>
                    )}
                    {coinDiscount > 0 && (
                        <div className="totals-row coin-discount">
                            <span>Coins Used:</span>
                            <span>- ৳{formatMoney(coinDiscount)}</span>
                        </div>
                    )}
                    {spinDiscount > 0 && (
                        <div className="totals-row spin-discount">
                            <span>Lucky Spin ({order.spinDiscountPercentage}%):</span>
                            <span>- ৳{formatMoney(spinDiscount)}</span>
                        </div>
                    )}
                    <div className="totals-row">
                        <span>Delivery Charge:</span>
                        <span>৳{formatMoney(order.shippingFee)}</span>
                    </div>
                    {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                        <div className="totals-row">
                            <span>COD Surcharge:</span>
                            <span>৳{formatMoney(order.cashOnDeliveryFee)}</span>
                        </div>
                    )}
                    <div className="totals-row grand">
                        <span>Amount Due:</span>
                        <span>৳{formatMoney(order.total)}</span>
                    </div>
                </div>
            </div>

            <div className="footer">
                <p className="tagline">Premium Shopping Experience</p>
                <p>pabnamart.contact@gmail.com • www.pabna-mart.shop</p>
                <p>Authorized Digital Copy • Issued via PabnaMart Platform</p>
            </div>
        </div>
    );
};

export default function AdminOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (!orderId) return;

        const orderRef = doc(getFirestore(app), 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                setOrder({ ...docSnap.data(), id: docSnap.id } as Order);
            } else {
                router.replace('/admin/orders');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderId, router]);

    const isAppEnvironment = () => {
        if (typeof window === 'undefined') return false;
        const ua = window.navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
        const isWebView = ua.includes('wv') || (ua.includes('android') && ua.includes('version/'));
        return isWebView || isMobile;
    };

    const handleActionClick = () => {
        if (isAppEnvironment()) {
            setShowPreview(true);
        } else {
            handleDownloadPDF();
        }
    };

    const handleDownloadPDF = async () => {
        if (!order) return;
        setIsDownloading(true);
        
        try {
            const html2pdf = (await import('html2pdf.js' as any)).default;
            const element = document.getElementById('printable-invoice');
            
            if (!element) throw new Error("Invoice element not found");

            element.classList.remove('hidden');

            const opt = {
                margin: 0,
                filename: `Invoice_#${order.orderNumber}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { 
                    scale: 4, 
                    useCORS: true, 
                    letterRendering: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error("PDF Download failed:", error);
        } finally {
            const element = document.getElementById('printable-invoice');
            if (element) element.classList.add('hidden');
            setIsDownloading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Order not found</h2>
                <Button asChild variant="link">
                    <Link href="/admin/orders">Back to Orders</Link>
                </Button>
            </div>
        );
    }
    
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const voucherDiscount = order.voucherDiscount || 0;
    const coinDiscount = order.coinDiscount || 0;
    const spinDiscount = order.spinDiscount || 0;

    return (
        <div className="container mx-auto max-w-2xl px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleActionClick} 
                    disabled={isDownloading}
                    className="bg-primary hover:bg-primary/90 shadow-md font-bold"
                >
                    {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDownloading ? "Generating PDF..." : "Download Invoice (PDF)"}
                </Button>
            </div>

            <Card className="shadow-lg border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold">Order Overview</CardTitle>
                            <CardDescription className="font-mono font-bold text-primary">#{order.orderNumber}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize px-3 py-1 font-bold">
                            {order.status.replace('-', ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <OrderStatusStepper currentStatus={order.status} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 p-6 rounded-2xl border">
                        <div className="space-y-3">
                            <h3 className="font-bold flex items-center gap-2 text-primary uppercase text-xs tracking-widest">
                                <MapPin className="h-4 w-4" /> Shipping Details
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-black text-foreground">{order.shippingAddress.fullName}</p>
                                <p className="font-medium">{order.shippingAddress.phone}</p>
                                <p>{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                                <p>{order.shippingAddress.city}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-bold flex items-center gap-2 text-primary uppercase text-xs tracking-widest">
                                <CreditCard className="h-4 w-4" /> Payment Status
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p><span className="font-bold text-foreground">Method:</span> <span className="capitalize font-medium">{order.paymentMethod.replace('-', ' ')}</span></p>
                                {order.transactionId && <p><span className="font-bold text-foreground">Trx ID:</span> <span className="font-mono text-xs">{order.transactionId}</span></p>}
                                {order.paymentAccountNumber && <p><span className="font-bold text-foreground">From:</span> <span className="font-mono text-xs">{order.paymentAccountNumber}</span></p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" /> Purchased Items
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-4 py-4 border-b last:border-0 hover:bg-muted/5 transition-colors px-2 rounded-lg">
                                    <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate flex items-center gap-2">
                                            {item.name}
                                            {item.isB1G1 && (
                                                <span className="bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">B1G1</span>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                            {item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'Standard Edition'}
                                        </p>
                                        <p className="text-xs font-black text-primary mt-1">Qty: {formatQuantity(item.quantity)} {item.unit || 'Pcs'}</p>
                                    </div>
                                    <div className="text-right font-black text-sm">
                                        ৳{formatMoney(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Smartphone className="h-32 w-32 rotate-12" />
                        </div>
                        <div className="flex justify-between text-sm opacity-70">
                            <span>Cart Subtotal</span>
                            <span>৳{formatMoney(subtotal)}</span>
                        </div>
                        {voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-400 font-bold">
                                <span>Voucher Applied</span>
                                <span>- ৳{formatMoney(voucherDiscount)}</span>
                            </div>
                        )}
                        {coinDiscount > 0 && (
                            <div className="flex justify-between text-sm text-yellow-400 font-bold">
                                <span>Reward Coins</span>
                                <span>- ৳{formatMoney(coinDiscount)}</span>
                            </div>
                        )}
                        {spinDiscount > 0 && (
                            <div className="flex justify-between text-sm text-indigo-400 font-bold">
                                <span>Lucky Spin ({order.spinDiscountPercentage}%)</span>
                                <span>- ৳{formatMoney(spinDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm opacity-70">
                            <span>Delivery Charge</span>
                            <span>৳{formatMoney(order.shippingFee)}</span>
                        </div>
                        {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                            <div className="flex justify-between text-sm opacity-70">
                                <span>Service Surcharge</span>
                                <span>৳{formatMoney(order.cashOnDeliveryFee)}</span>
                            </div>
                        )}
                        <Separator className="bg-slate-700" />
                        <div className="flex justify-between font-black text-3xl pt-2 text-white tracking-tighter">
                            <span>Amount Paid</span>
                            <span>৳{formatMoney(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hidden High-Quality Invoice for PDF Generation */}
            <div id="printable-invoice" className="hidden">
              {order && <PrintableInvoice 
                order={order} 
                subtotal={subtotal} 
                voucherDiscount={voucherDiscount} 
                coinDiscount={coinDiscount} 
                spinDiscount={spinDiscount} 
              />}
            </div>

            {/* App Preview Dialog (Review Mode) */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-[95vw] sm:max-w-[800px] p-0 overflow-hidden h-[90vh] flex flex-col rounded-t-xl sm:rounded-xl">
                    <DialogHeader className="p-4 border-b bg-background sticky top-0 z-20 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                             <div className="bg-primary/10 p-2 rounded-lg">
                                <Eye className="h-5 w-5 text-primary" />
                             </div>
                             <div>
                                <DialogTitle className="text-lg">Invoice Review</DialogTitle>
                                <DialogDescription className="text-xs">Preview of Order #{order.orderNumber}</DialogDescription>
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="default" onClick={handleDownloadPDF} disabled={isDownloading} className="font-bold bg-primary h-9">
                                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                                Download
                            </Button>
                            <DialogClose asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogHeader>
                    <ScrollArea className="flex-grow bg-slate-100 p-0">
                         <div className="relative w-full min-h-full py-8 flex flex-col items-center">
                            {/* Scaled centered wrapper */}
                            <div className="relative shadow-2xl bg-white scale-[0.4] xs:scale-[0.45] sm:scale-[0.7] md:scale-100 origin-top transform-gpu rounded-sm mb-4"
                                 style={{ width: '210mm', height: '297mm' }}>
                                <PrintableInvoice 
                                    order={order} 
                                    subtotal={subtotal} 
                                    voucherDiscount={voucherDiscount} 
                                    coinDiscount={coinDiscount} 
                                    spinDiscount={spinDiscount} 
                                />
                            </div>
                         </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        PabnaMart Digital Invoice System
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

