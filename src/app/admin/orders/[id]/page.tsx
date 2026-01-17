
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
    <div className="invoice-box">
        <div className="header">
            <h1>PabnaMart</h1>
            <p>Order Invoice</p>
        </div>

        <div className="details-grid">
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

        <table className="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {order.items.map(item => (
                    <tr key={item.id}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">৳{item.price.toFixed(2)}</td>
                        <td className="text-right">৳{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="totals-section">
            <table className="totals-table">
                <tbody>
                    <tr><td>Subtotal:</td><td className="text-right">৳{subtotal.toFixed(2)}</td></tr>
                    {voucherDiscount > 0 && <tr><td>Voucher Discount:</td><td className="text-right">- ৳{voucherDiscount.toFixed(2)}</td></tr>}
                    <tr><td>Shipping Fee:</td><td className="text-right">৳{order.shippingFee.toFixed(2)}</td></tr>
                    {order.cashOnDeliveryFee && order.cashOnDeliveryFee > 0 && <tr><td>COD Fee:</td><td className="text-right">৳{order.cashOnDeliveryFee.toFixed(2)}</td></tr>}
                    <tr className="grand-total"><td>Grand Total:</td><td className="text-right">৳{order.total}</td></tr>
                </tbody>
            </table>
        </div>
        
        <div className="footer">
             <p className="status">
                {order.paymentMethod === 'cash-on-delivery' ? 'Payment Method: Cash on Delivery' : 'Status: PAID'}
            </p>
            <p>Thank you for your business!</p>
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
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { 
                            font-family: 'Inter', sans-serif;
                            font-size: 12px;
                            line-height: 1.6;
                            color: #374151;
                            margin: 0;
                            padding: 20px;
                            background-color: #fff;
                        }
                        .invoice-box {
                            max-width: 800px;
                            margin: auto;
                            padding: 30px;
                            border: 1px solid #e5e7eb;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
                            border-radius: 8px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 40px;
                        }
                        .header h1 {
                            font-size: 2em;
                            font-weight: 700;
                            color: #111827;
                            margin: 0;
                        }
                        .header p {
                            font-size: 1em;
                            color: #6b7280;
                            margin: 5px 0 0;
                        }
                        .details-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-bottom: 40px;
                            font-size: 0.9em;
                        }
                        .details-grid div p {
                            margin: 0 0 4px;
                        }
                        .details-grid .text-right {
                            text-align: right;
                        }
                        .items-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 30px;
                        }
                        .items-table th, .items-table td {
                            padding: 10px 15px;
                            border-bottom: 1px solid #e5e7eb;
                            text-align: left;
                        }
                        .items-table th {
                            background-color: #f9fafb;
                            font-weight: 600;
                            text-transform: uppercase;
                            font-size: 0.8em;
                            letter-spacing: 0.5px;
                            color: #4b5563;
                        }
                        .items-table .text-center {
                            text-align: center;
                        }
                        .items-table .text-right {
                            text-align: right;
                        }
                        .items-table tr:last-child td {
                            border-bottom: none;
                        }
                        .totals-section {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 30px;
                        }
                        .totals-table {
                            width: 100%;
                            max-width: 320px;
                        }
                        .totals-table td {
                            padding: 6px 0;
                        }
                        .totals-table tr:last-child td {
                            padding-top: 10px;
                        }
                        .totals-table .grand-total td {
                            font-size: 1.15em;
                            font-weight: 700;
                            padding-top: 10px;
                            border-top: 2px solid #111827;
                            color: #111827;
                        }
                        .footer {
                            border-top: 1px solid #e5e7eb;
                            padding-top: 20px;
                            margin-top: 40px;
                            text-align: center;
                            color: #6b7280;
                            font-size: 0.9em;
                        }
                        .footer .status {
                            font-weight: 600;
                            font-size: 1.1em;
                            margin-bottom: 8px;
                            color: #111827;
                        }
                        strong {
                            font-weight: 600;
                            color: #1f2937;
                        }
                        .capitalize {
                            text-transform: capitalize;
                        }
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

            <div className="hidden">
              <div ref={printableRef}>
                {order && <PrintableInvoice order={order} subtotal={subtotal} voucherDiscount={voucherDiscount} />}
              </div>
            </div>
        </>
    );

    