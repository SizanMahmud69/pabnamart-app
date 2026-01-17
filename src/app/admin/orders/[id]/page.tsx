
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Printer, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import OrderStatusStepper from '@/components/OrderStatusStepper';

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

const PrintableInvoice = ({ order, subtotal, voucherDiscount }: { order: Order, subtotal: number, voucherDiscount: number }) => (
    <div className="p-4">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">PabnaMart</h1>
            <p>Order Invoice</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
                <p><strong>Order ID:</strong> #{order.orderNumber}</p>
                <p><strong>Order Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className="capitalize">{order.status.replace('-', ' ')}</span></p>
            </div>
            <div className="text-right">
                <p><strong>Billed To:</strong></p>
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}, {order.shippingAddress.area}, {order.shippingAddress.city}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
            </div>
        </div>

        <table className="w-full text-left text-sm mb-6">
            <thead className="bg-gray-100">
                <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {order.items.map(item => (
                    <tr key={item.id} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">৳{item.price.toFixed(2)}</td>
                        <td className="p-2 text-right">৳{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="flex justify-end mb-6">
            <div className="w-full max-w-xs text-sm">
                <div className="flex justify-between py-1 border-b"><span>Subtotal:</span><span>৳{subtotal.toFixed(2)}</span></div>
                {voucherDiscount > 0 && <div className="flex justify-between py-1 border-b"><span>Voucher Discount:</span><span>- ৳{voucherDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between py-1 border-b"><span>Shipping Fee:</span><span>৳{order.shippingFee.toFixed(2)}</span></div>
                {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && <div className="flex justify-between py-1 border-b"><span>COD Fee:</span><span>৳{order.cashOnDeliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base mt-2 pt-2"><span>Grand Total:</span><span>৳{order.total}</span></div>
            </div>
        </div>
        
        <div className="border-t pt-4 text-center">
             <p className="font-bold text-lg">
                {order.paymentMethod === 'cash-on-delivery' ? 'Payment Method: Cash on Delivery' : 'Status: PAID'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Thank you for your business!</p>
        </div>
    </div>
);


export default function AdminOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const printableRef = useRef<HTMLDivElement>(null);


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
        const printContent = printableRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Invoice</title>');
                printWindow.document.write(`
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.5; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                        th { background-color: #f1f5f9; }
                        strong { font-weight: 600; }
                        .p-4 { padding: 1.5rem; }
                        .text-center { text-align: center; }
                        .mb-6 { margin-bottom: 1.5rem; }
                        .text-3xl { font-size: 1.875rem; }
                        .font-bold { font-weight: 700; }
                        .grid { display: grid; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .gap-4 { gap: 1rem; }
                        .text-sm { font-size: 0.875rem; }
                        .text-right { text-align: right; }
                        .w-full { width: 100%; }
                        .bg-gray-100 { background-color: #f3f4f6; }
                        .p-2 { padding: 0.5rem; }
                        .border-b { border-bottom-width: 1px; border-color: #e2e8f0; }
                        .flex { display: flex; }
                        .justify-end { justify-content: flex-end; }
                        .max-w-xs { max-width: 20rem; }
                        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                        .text-base { font-size: 1rem; }
                        .mt-2 { margin-top: 0.5rem; }
                        .pt-4 { padding-top: 1rem; }
                        .border-t { border-top-width: 1px; border-color: #e2e8f0; }
                        .text-lg { font-size: 1.125rem; }
                        .text-xs { font-size: 0.75rem; }
                        .text-gray-500 { color: #6b7280; }
                        .capitalize { text-transform: capitalize; }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                
                // Use a timeout to ensure content is loaded before printing
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
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

    return (
        <>
            <div className="no-print">
                <div className="container mx-auto max-w-2xl px-4 py-6">
                    <div className="flex justify-between items-center mb-4">
                        <Button asChild variant="ghost">
                            <Link href="/admin/orders">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Orders
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Invoice
                        </Button>
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>Order #{order.orderNumber}</CardTitle>
                                        <CardDescription>Placed on {new Date(order.date).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <Badge variant={getStatusVariant(order.status)} className="capitalize text-lg">
                                        {order.status.replace('-', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <OrderStatusStepper currentStatus={order.status} />
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 py-3">
                                            <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                            <div className="flex-grow">
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">৳{item.price * item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>৳{subtotal.toFixed(2)}</span>
                                    </div>
                                    {voucherDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span className="text-muted-foreground">Voucher Discount</span>
                                            <span>- ৳{voucherDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping Fee</span>
                                        <span>৳{order.shippingFee.toFixed(2)}</span>
                                    </div>
                                    {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cash on Delivery Fee</span>
                                            <span>৳{order.cashOnDeliveryFee.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between font-bold text-xl">
                                        <span>Total</span>
                                        <span>৳{order.total}</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Shipping & Payment</h3>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">Shipping Address</p>
                                            <p className="text-muted-foreground text-sm">
                                                {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.area}, {order.shippingAddress.city}, Phone: {order.shippingAddress.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">Payment Method</p>
                                            <p className="text-muted-foreground text-sm capitalize">{order.paymentMethod.replace('-', ' ')}</p>
                                        </div>
                                    </div>
                                    {order.paymentMethod !== 'cash-on-delivery' && (
                                        <>
                                            {order.paymentAccountNumber && (
                                                <div className="flex items-start gap-3">
                                                    <Smartphone className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold">Payment From</p>
                                                        <p className="text-muted-foreground text-sm font-mono">{order.paymentAccountNumber}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {order.transactionId && (
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold">Transaction ID</p>
                                                        <p className="text-muted-foreground text-sm font-mono">{order.transactionId}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <div ref={printableRef} style={{ display: 'none' }}>
              {order && <PrintableInvoice order={order} subtotal={subtotal} voucherDiscount={voucherDiscount} />}
            </div>
        </>
    );
}
