
"use client";

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CreditCard, Download, Smartphone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { formatQuantity, formatMoney } from '@/lib/utils';

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
                .invoice-container-pdf {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 25mm;
                    margin: 0;
                    background: white;
                    position: relative;
                    font-family: 'Inter', sans-serif;
                    box-sizing: border-box;
                    color: #1f2937;
                }
                .brand-border {
                    position: absolute;
                    inset: 15px;
                    border: 1px solid hsl(262 84% 59% / 0.15);
                    pointer-events: none;
                }
                .brand-border::before {
                    content: 'pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart';
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 8px;
                    font-weight: 900;
                    color: hsl(262 84% 59%);
                    text-transform: uppercase;
                    background: white;
                    padding: 0 10px;
                    letter-spacing: 3px;
                    white-space: nowrap;
                    opacity: 0.6;
                }
                .brand-border::after {
                    content: 'pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart pabnamart';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 8px;
                    font-weight: 900;
                    color: hsl(262 84% 59%);
                    text-transform: uppercase;
                    background: white;
                    padding: 0 10px;
                    letter-spacing: 3px;
                    white-space: nowrap;
                    opacity: 0.6;
                }
                .header { text-align: center; margin-bottom: 40px; }
                .header h1 { font-size: 44px; font-weight: 900; color: hsl(262 84% 59%); margin: 0; letter-spacing: -2px; }
                .header p { font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 800; letter-spacing: 5px; margin-top: 8px; }
                
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .info-section { width: 45%; }
                .info-section h3 { font-size: 11px; text-transform: uppercase; color: #9ca3af; margin-bottom: 10px; font-weight: 800; border-bottom: 1px solid #f3f4f6; padding-bottom: 5px; }
                .info-section p { margin: 3px 0; font-size: 13px; line-height: 1.4; color: #374151; }
                .text-right { text-align: right; }
                
                .payment-info-banner { 
                    background: #f8fafc; 
                    border: 1px solid #e2e8f0; 
                    padding: 12px 20px; 
                    border-radius: 12px; 
                    margin-bottom: 35px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .payment-info-banner div { font-size: 12px; font-weight: 700; color: #475569; }
                .payment-info-banner span { color: #1e293b; font-family: monospace; font-size: 13px; margin-left: 5px; }

                .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .table th { background: #f9fafb; padding: 14px 15px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; border-bottom: 2px solid #f1f5f9; }
                .table td { padding: 18px 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
                .item-name { font-weight: 800; color: #1e293b; display: block; }
                .item-meta { font-size: 10px; color: #94a3b8; margin-top: 5px; font-weight: 700; text-transform: uppercase; }
                .b1g1-badge { font-size: 9px; font-weight: 900; background: #fff1f2; color: #e11d48; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecdd3; margin-left: 10px; }
                
                .footer-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
                .stamp { 
                    border: 5px double; 
                    padding: 12px 25px; 
                    text-align: center; 
                    transform: rotate(-15deg); 
                    opacity: 0.15; 
                    border-radius: 15px; 
                    margin-top: 30px;
                    margin-left: 20px;
                }
                .stamp-main { font-size: 42px; font-weight: 900; letter-spacing: 2px; }
                .stamp-sub { font-size: 9px; font-weight: 800; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
                .stamp.paid { color: #059669; border-color: #059669; }
                .stamp.unpaid { color: #e11d48; border-color: #e11d48; }
                
                .totals { width: 320px; background: #fdfdfd; padding: 15px; border-radius: 15px; }
                .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 600; color: #475569; }
                .totals-row.discount { color: #059669; font-weight: 700; }
                .totals-row.grand { 
                    font-size: 26px; 
                    font-weight: 900; 
                    color: #0f172a; 
                    border-top: 2px solid #0f172a; 
                    margin-top: 15px; 
                    padding-top: 15px; 
                    letter-spacing: -1px;
                }
                
                .note { margin-top: 80px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 25px; }
                .note p { margin: 4px 0; font-size: 11px; color: #94a3b8; font-weight: 500; }
                .note .thanks { font-weight: 900; color: #1e293b; font-size: 15px; margin-bottom: 8px; letter-spacing: -0.5px; }
            `}</style>

            <div className="brand-border"></div>

            <div className="header">
                <h1>PabnaMart</h1>
                <p>Official Purchase Receipt</p>
            </div>

            <div className="info-grid">
                <div className="info-section">
                    <h3>Order Record</h3>
                    <p><strong>Invoice ID:</strong> #{order.orderNumber}</p>
                    <p><strong>Date Issued:</strong> {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{order.status.replace('-', ' ')}</span></p>
                </div>
                <div className="info-section text-right">
                    <h3>Delivery To</h3>
                    <p><strong>{order.shippingAddress.fullName}</strong></p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.area}, {order.shippingAddress.city}</p>
                    <p>Contact: {order.shippingAddress.phone}</p>
                </div>
            </div>

            <div className="payment-info-banner">
                <div>METHOD: <span>{order.paymentMethod.replace('-', ' ').toUpperCase()}</span></div>
                {isPaid && order.transactionId && <div>TRX ID: <span>{order.transactionId}</span></div>}
                {isPaid && order.paymentAccountNumber && <div>SOURCE: <span>{order.paymentAccountNumber}</span></div>}
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '55%' }}>Item Description</th>
                        <th style={{ textAlign: 'center' }}>Quantity</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <span className="item-name">{item.name}</span>
                                <div className="flex items-center">
                                    <span className="item-meta">
                                        {item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'Standard Variant'}
                                    </span>
                                    {item.isB1G1 && <span className="b1g1-badge">B1G1 OFFER</span>}
                                </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{formatQuantity(item.quantity)} {item.unit}</td>
                            <td style={{ textAlign: 'right' }}>৳{formatMoney(item.price)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800 }}>৳{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="footer-flex">
                <div className={`stamp ${stampClass}`}>
                    <div className="stamp-main">{stampText}</div>
                    <div className="stamp-sub">Verified Authenticity</div>
                </div>
                
                <div className="totals">
                    <div className="totals-row">
                        <span>Items Subtotal:</span>
                        <span>৳{formatMoney(subtotal)}</span>
                    </div>
                    {voucherDiscount > 0 && (
                        <div className="totals-row discount">
                            <span>Voucher Applied:</span>
                            <span>- ৳{formatMoney(voucherDiscount)}</span>
                        </div>
                    )}
                    {coinDiscount > 0 && (
                        <div className="totals-row discount">
                            <span>Rewards Used:</span>
                            <span>- ৳{formatMoney(coinDiscount)}</span>
                        </div>
                    )}
                    {spinDiscount > 0 && (
                        <div className="totals-row discount">
                            <span>Lucky Spin ({order.spinDiscountPercentage}%):</span>
                            <span>- ৳{formatMoney(spinDiscount)}</span>
                        </div>
                    )}
                    <div className="totals-row">
                        <span>Logistic Fee:</span>
                        <span>৳{formatMoney(order.shippingFee)}</span>
                    </div>
                    {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                        <div className="totals-row">
                            <span>Service Surcharge:</span>
                            <span>৳{formatMoney(order.cashOnDeliveryFee)}</span>
                        </div>
                    )}
                    <div className="totals-row grand">
                        <span>Total Due:</span>
                        <span>৳{formatMoney(order.total)}</span>
                    </div>
                </div>
            </div>

            <div className="note">
                <p className="thanks">Elite Shopping Experience with PabnaMart</p>
                <p>For support, please contact us at support@pabnamart.com</p>
                <p>Authorized Digital Invoice • www.pabnamart.com</p>
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

    const handleDownloadPDF = async () => {
        if (!order) return;
        setIsDownloading(true);
        
        try {
            // Import html2pdf dynamically to avoid SSR issues
            const html2pdf = (await import('html2pdf.js' as any)).default;
            const element = document.getElementById('printable-invoice');
            
            if (!element) throw new Error("Invoice element not found");

            // Temporary reveal for capture
            element.classList.remove('hidden');

            const opt = {
                margin: 0,
                filename: `Invoice_#${order.orderNumber}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 3, // Higher scale for better text clarity
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
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    className="bg-primary hover:bg-primary/90 shadow-md"
                >
                    {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDownloading ? "Generating PDF..." : "Download Invoice (PDF)"}
                </Button>
            </div>

            <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">Order Review</CardTitle>
                            <CardDescription className="font-mono">#{order.orderNumber}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize px-3 py-1">
                            {order.status.replace('-', ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <OrderStatusStepper currentStatus={order.status} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 p-4 rounded-xl border">
                        <div className="space-y-3">
                            <h3 className="font-bold flex items-center gap-2 text-primary">
                                <MapPin className="h-4 w-4" /> Shipping Address
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p className="font-bold text-foreground">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.phone}</p>
                                <p>{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                                <p>{order.shippingAddress.city}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-bold flex items-center gap-2 text-primary">
                                <CreditCard className="h-4 w-4" /> Payment Info
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p><span className="font-medium text-foreground">Method:</span> <span className="capitalize">{order.paymentMethod.replace('-', ' ')}</span></p>
                                {order.transactionId && <p><span className="font-medium text-foreground">Trx ID:</span> {order.transactionId}</p>}
                                {order.paymentAccountNumber && <p><span className="font-medium text-foreground">From:</span> {order.paymentAccountNumber}</p>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" /> Order Items
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-center gap-4 py-3 border-b last:border-0">
                                    <div className="h-16 w-16 rounded-lg overflow-hidden border bg-white shadow-sm flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate flex items-center gap-2">
                                            {item.name}
                                            {item.isB1G1 && (
                                                <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-1.5 py-0.5 rounded">B1G1</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.color || item.size ? `${item.color || ''} ${item.size || ''}` : 'No variation'}
                                        </p>
                                        <p className="text-xs font-medium">Qty: {formatQuantity(item.quantity)} {item.unit || 'Pcs'}</p>
                                    </div>
                                    <div className="text-right font-bold text-sm">
                                        ৳{formatMoney(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">৳{formatMoney(subtotal)}</span>
                        </div>
                        {voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>Voucher Discount</span>
                                <span>- ৳{formatMoney(voucherDiscount)}</span>
                            </div>
                        )}
                        {coinDiscount > 0 && (
                            <div className="flex justify-between text-sm text-yellow-600 font-bold">
                                <span>Coin Discount</span>
                                <span>- ৳{formatMoney(coinDiscount)}</span>
                            </div>
                        )}
                        {spinDiscount > 0 && (
                            <div className="flex justify-between text-sm text-indigo-600 font-bold">
                                <span>Lucky Spin ({order.spinDiscountPercentage}%)</span>
                                <span>- ৳{formatMoney(spinDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shipping Fee</span>
                            <span className="font-medium">৳{formatMoney(order.shippingFee)}</span>
                        </div>
                        {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">COD Fee</span>
                                <span className="font-medium">৳{formatMoney(order.cashOnDeliveryFee)}</span>
                            </div>
                        )}
                        <Separator className="bg-primary/20" />
                        <div className="flex justify-between font-black text-2xl text-primary pt-2">
                            <span>Total</span>
                            <span>৳{formatMoney(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hidden container for PDF rendering */}
            <div id="printable-invoice" className="hidden">
              {order && <PrintableInvoice 
                order={order} 
                subtotal={subtotal} 
                voucherDiscount={voucherDiscount} 
                coinDiscount={coinDiscount} 
                spinDiscount={spinDiscount} 
              />}
            </div>
        </div>
    );
}
