
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Printer, Smartphone, X } from 'lucide-react';
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
    const stampText = isPaid ? 'Paid' : 'Unpaid';
    const stampClass = isPaid ? 'paid' : 'unpaid';
    
    return (
        <div className="invoice-box">
            <div className="header">
                <h1 className="site-title">PabnaMart</h1>
                <p className="invoice-subtitle">Order Invoice</p>
            </div>

            <div className="details-grid">
                <div className="order-info">
                    <p><strong>Order ID:</strong> <span className="text-primary">#{order.orderNumber}</span></p>
                    <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{order.status.replace('-', ' ')}</span></p>
                </div>
                <div className="billing-info text-right">
                    <p className="section-header">Billed To:</p>
                    <p className="font-bold">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address}, {order.shippingAddress.area}</p>
                    <p>{order.shippingAddress.city}</p>
                    <p>Phone: {order.shippingAddress.phone}</p>
                </div>
            </div>

            <div className="payment-summary">
                <h3 className="section-title">Payment Details</h3>
                <div className="payment-grid">
                    <p><strong>Method:</strong> <span className="capitalize">{order.paymentMethod.replace('-', ' ')}</span></p>
                    {isPaid && order.transactionId && <p><strong>Trx ID:</strong> {order.transactionId}</p>}
                    {isPaid && order.paymentAccountNumber && <p><strong>From:</strong> {order.paymentAccountNumber}</p>}
                </div>
            </div>

            <table className="items-table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, index) => (
                        <tr key={`${item.id}-${index}`}>
                            <td>
                                <div className="item-name">{item.name}</div>
                                {item.isB1G1 && <span className="b1g1-tag">B1G1</span>}
                                {(item.color || item.size) && (
                                    <div className="item-variants">
                                        {item.color}{item.color && item.size ? ', ' : ''}{item.size}
                                    </div>
                                )}
                            </td>
                            <td className="text-center">{formatQuantity(item.quantity)} {item.unit || 'Pcs'}</td>
                            <td className="text-right">৳{formatMoney(item.price)}</td>
                            <td className="text-right">৳{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="bottom-section">
                <div className="stamp-container">
                    <div className={`stamp ${stampClass}`}>{stampText}</div>
                </div>
                <div className="totals-container">
                    <table className="totals-table">
                        <tbody>
                            <tr>
                                <td>Subtotal:</td>
                                <td className="text-right">৳{formatMoney(subtotal)}</td>
                            </tr>
                            {voucherDiscount > 0 && (
                                <tr className="discount-row">
                                    <td>Voucher Discount:</td>
                                    <td className="text-right">- ৳{formatMoney(voucherDiscount)}</td>
                                </tr>
                            )}
                            {coinDiscount > 0 && (
                                <tr className="discount-row">
                                    <td>Coin Discount:</td>
                                    <td className="text-right">- ৳{formatMoney(coinDiscount)}</td>
                                </tr>
                            )}
                            {spinDiscount > 0 && (
                                <tr className="discount-row">
                                    <td>Spin Discount ({order.spinDiscountPercentage}%):</td>
                                    <td className="text-right">- ৳{formatMoney(spinDiscount)}</td>
                                </tr>
                            )}
                            <tr>
                                <td>Shipping Fee:</td>
                                <td className="text-right">৳{formatMoney(order.shippingFee)}</td>
                            </tr>
                            {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                                <tr>
                                    <td>COD Fee:</td>
                                    <td className="text-right">৳{formatMoney(order.cashOnDeliveryFee)}</td>
                                </tr>
                            )}
                            <tr className="grand-total-row">
                                <td>Grand Total:</td>
                                <td className="text-right">৳{formatMoney(order.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="invoice-footer">
                <p className="thank-you">Thank you for shopping with PabnaMart!</p>
                <p className="contact-info">support@pabnamart.com | www.pabnamart.com</p>
            </div>
        </div>
    )
};


export default function AdminOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

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

    const handlePrint = () => {
        const printContent = document.getElementById('printable-invoice');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Invoice_#${order?.orderNumber}</title>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
                            <style>
                                @page { size: auto; margin: 15mm; }
                                body { font-family: 'Inter', sans-serif; font-size: 11px; color: #1f2937; margin: 0; padding: 0; background: #fff; }
                                .invoice-box { max-width: 100%; margin: auto; padding: 0; border: none; }
                                .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; }
                                .header .site-title { font-size: 28px; font-weight: 800; color: hsl(262 84% 59%); margin: 0; letter-spacing: -1px; }
                                .header .invoice-subtitle { font-size: 12px; color: #6b7280; margin: 3px 0 0; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
                                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 25px; }
                                .billing-info .section-header { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
                                .billing-info p { margin: 1px 0; }
                                .order-info p { margin: 3px 0; font-size: 11px; }
                                .text-primary { color: hsl(262 84% 59%); font-weight: 700; }
                                .payment-summary { background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 25px; border: 1px solid #f3f4f6; }
                                .payment-summary .section-title { font-size: 12px; font-weight: 700; margin: 0 0 8px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                                .payment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
                                .payment-grid p { margin: 0; font-size: 10px; }
                                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .items-table th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
                                .items-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
                                .item-name { font-weight: 600; font-size: 11px; color: #111827; }
                                .item-variants { font-size: 9px; color: #6b7280; margin-top: 2px; }
                                .b1g1-tag { font-size: 8px; font-weight: 800; background: #fdf2f8; color: #db2777; padding: 1px 4px; border-radius: 3px; border: 1px solid #fbcfe8; margin-left: 5px; }
                                .bottom-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
                                .stamp-container { position: relative; display: flex; align-items: center; justify-content: center; }
                                .stamp { border: 4px double; padding: 10px 20px; font-size: 28px; font-weight: 800; text-transform: uppercase; transform: rotate(-12deg); opacity: 0.2; border-radius: 8px; }
                                .stamp.paid { color: #059669; border-color: #059669; }
                                .stamp.unpaid { color: #dc2626; border-color: #dc2626; }
                                .totals-table { width: 100%; max-width: 250px; margin-left: auto; }
                                .totals-table td { padding: 4px 0; font-size: 11px; }
                                .discount-row { color: #059669; font-weight: 500; }
                                .grand-total-row td { font-size: 16px; font-weight: 800; padding-top: 10px; border-top: 2px solid #111827; color: #111827; }
                                .invoice-footer { margin-top: 40px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; color: #9ca3af; }
                                .thank-you { font-weight: 700; color: #4b5563; margin-bottom: 4px; font-size: 12px; }
                                .contact-info { font-size: 9px; }
                                .text-right { text-align: right; }
                                .text-center { text-align: center; }
                                .capitalize { text-transform: capitalize; }
                            </style>
                        </head>
                        <body>
                            ${printContent.innerHTML}
                            <script>
                                window.onload = function() {
                                    window.print();
                                    window.onafterprint = function() { window.close(); };
                                    // Fallback for some browsers
                                    setTimeout(function() {
                                        window.onfocus = function() { window.close(); }
                                    }, 500);
                                }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
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
                <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Link>
                </Button>
                <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={handlePrint} className="bg-primary hover:bg-primary/90">
                        <Printer className="mr-2 h-4 w-4" />
                        Print & Save PDF
                    </Button>
                </div>
            </div>

            <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">Order Details</CardTitle>
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

            {/* Hidden printable element */}
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
