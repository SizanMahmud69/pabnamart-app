
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
                    margin: 0 auto;
                    background: white;
                    position: relative;
                    font-family: 'Inter', sans-serif !important;
                    box-sizing: border-box;
                    color: #0f172a;
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                }
                .brand-border {
                    position: absolute;
                    inset: 10mm;
                    border: 1px solid rgba(139, 92, 246, 0.1);
                    pointer-events: none;
                    z-index: 0;
                }
                
                .header { text-align: center; margin-bottom: 35px; position: relative; z-index: 10; }
                .header h1 { font-size: 42px; font-weight: 900; color: #8b5cf6; margin: 0; letter-spacing: -1.5px; }
                .header p { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 6px; margin-top: 5px; }
                
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 35px; position: relative; z-index: 10; }
                .info-section { width: 45%; }
                .info-section h3 { font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; font-weight: 800; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; letter-spacing: 1.5px; text-align: left; }
                .info-section p { margin: 2px 0; font-size: 12px; line-height: 1.5; color: #334155; text-align: left; }
                .info-section .highlight { font-weight: 700; color: #0f172a; }
                .text-right { text-align: right !important; }
                .text-right h3, .text-right p { text-align: right !important; }
                
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
                .stamp.paid { color: #059669; border-color: #059669; }
                .stamp.unpaid { color: #e11d48; border-color: #e11d48; }
                
                .totals-card { width: 280px; background: #fdfdfd; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
                .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; font-weight: 500; color: #475569; }
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
                                <div style={{ fontSize: '9px', color: '#64748b' }}>
                                    {item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'Standard Edition'}
                                </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{formatQuantity(item.quantity)} {item.unit}</td>
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
                        <div className="totals-row" style={{ color: '#059669' }}>
                            <span>Voucher Applied:</span>
                            <span>- ৳{formatMoney(voucherDiscount)}</span>
                        </div>
                    )}
                    {coinDiscount > 0 && (
                        <div className="totals-row" style={{ color: '#ca8a04' }}>
                            <span>Coins Used:</span>
                            <span>- ৳{formatMoney(coinDiscount)}</span>
                        </div>
                    )}
                    {spinDiscount > 0 && (
                        <div className="totals-row" style={{ color: '#4f46e5' }}>
                            <span>Lucky Spin ({order.spinDiscountPercentage}%):</span>
                            <span>- ৳{formatMoney(spinDiscount)}</span>
                        </div>
                    )}
                    <div className="totals-row">
                        <span>Delivery Charge:</span>
                        <span>৳{formatMoney(order.shippingFee)}</span>
                    </div>
                    <div className="totals-row grand">
                        <span>Amount Due:</span>
                        <span>৳{formatMoney(order.total)}</span>
                    </div>
                </div>
            </div>

            <div className="footer">
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

    const handleActionClick = () => {
        setShowPreview(true);
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
                html2canvas: { scale: 4, useCORS: true },
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

    if (loading) return <LoadingSpinner />;
    if (!order) return null;
    
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const voucherDiscount = order.voucherDiscount || 0;
    const coinDiscount = order.coinDiscount || 0;
    const spinDiscount = order.spinDiscount || 0;

    return (
        <div className="container mx-auto max-w-2xl px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button variant="default" size="sm" onClick={handleActionClick} disabled={isDownloading}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Invoice
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader className="bg-primary/5">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold">Order Details</CardTitle>
                            <CardDescription>Order #{order.orderNumber}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize px-3 py-1">
                            {order.status.replace('-', ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <OrderStatusStepper currentStatus={order.status} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg">
                        <div>
                            <h3 className="font-bold text-xs uppercase text-muted-foreground mb-2">Shipping</h3>
                            <p className="font-semibold text-sm">{order.shippingAddress.fullName}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress.phone}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-xs uppercase text-muted-foreground mb-2">Payment</h3>
                            <p className="text-sm font-semibold capitalize">{order.paymentMethod.replace('-', ' ')}</p>
                            {order.transactionId && <p className="text-xs font-mono">{order.transactionId}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 py-2 border-b last:border-0">
                                <div className="h-12 w-12 rounded border overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Qty: {formatQuantity(item.quantity)} {item.unit}</p>
                                </div>
                                <div className="text-right font-bold text-sm">৳{formatMoney(item.price * item.quantity)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm opacity-70">
                            <span>Subtotal</span>
                            <span>৳{formatMoney(subtotal)}</span>
                        </div>
                        {voucherDiscount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Voucher</span><span>- ৳{formatMoney(voucherDiscount)}</span></div>}
                        {coinDiscount > 0 && <div className="flex justify-between text-sm text-yellow-400"><span>Coins</span><span>- ৳{formatMoney(coinDiscount)}</span></div>}
                        {spinDiscount > 0 && <div className="flex justify-between text-sm text-indigo-400"><span>Spin Win</span><span>- ৳{formatMoney(spinDiscount)}</span></div>}
                        <div className="flex justify-between text-sm opacity-70">
                            <span>Delivery</span>
                            <span>৳{formatMoney(order.shippingFee)}</span>
                        </div>
                        <Separator className="bg-slate-700" />
                        <div className="flex justify-between font-black text-2xl pt-2">
                            <span>Total</span>
                            <span>৳{formatMoney(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div id="printable-invoice" className="hidden">
              <PrintableInvoice 
                order={order} 
                subtotal={subtotal} 
                voucherDiscount={voucherDiscount} 
                coinDiscount={coinDiscount} 
                spinDiscount={spinDiscount} 
              />
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-[100vw] sm:max-w-[800px] p-0 h-[100dvh] sm:h-[90vh] flex flex-col overflow-hidden bg-slate-100 border-0">
                    <DialogHeader className="p-4 border-b bg-background flex flex-row items-center justify-between space-y-0 shrink-0">
                        <DialogTitle>Invoice Review</DialogTitle>
                        <div className="flex gap-2">
                             <Button size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4 mr-1" />}
                                Download
                            </Button>
                            <DialogClose asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9"><X className="h-4 w-4" /></Button>
                            </DialogClose>
                        </div>
                    </DialogHeader>
                    <ScrollArea className="flex-1 w-full bg-slate-200">
                         <div className="w-full flex justify-center py-6 sm:py-10 min-h-full">
                            <div className="absolute left-1/2 -translate-x-1/2 shadow-2xl bg-white scale-[0.42] sm:scale-[0.6] md:scale-[0.85] origin-top"
                                 style={{ 
                                     width: '210mm', 
                                     height: '297mm',
                                     marginBottom: '20mm'
                                 }}>
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
                </DialogContent>
            </Dialog>
        </div>
    );
}
