
"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, Truck, PackageCheck, Undo2 } from "lucide-react";

const orders = [
  { id: '12345', status: 'pending', total: 450, date: '2023-10-26', items: 2 },
  { id: '12346', status: 'shipped', total: 250, date: '2023-10-25', items: 1 },
  { id: '12347', status: 'in-transit', total: 150, date: '2023-10-24', items: 1 },
  { id: '12348', status: 'delivered', total: 800, date: '2023-10-20', items: 3 },
  { id: '12349', status: 'returned', total: 120, date: '2023-10-15', items: 1 },
  { id: '12350', status: 'pending', total: 600, date: '2023-10-27', items: 4 },
];

const TABS = [
  { value: 'all', label: 'All Orders', icon: ShoppingBag },
  { value: 'pending', label: 'To Pay', icon: Package },
  { value: 'shipped', label: 'To Ship', icon: Truck },
  { value: 'in-transit', label: 'To Receive', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: PackageCheck },
  { value: 'returned', label: 'Returned', icon: Undo2 },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'all';

  const filteredOrders = status === 'all' 
    ? orders 
    : orders.filter(order => order.status === status);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <Tabs defaultValue={status} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
            {TABS.map(tab => (
                 <TabsTrigger key={tab.value} value={tab.value}>
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                 </TabsTrigger>
            ))}
        </TabsList>
        
        <TabsContent value={status}>
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <CardDescription>Date: {order.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>Items: {order.items}</p>
                            <p className="font-bold">Total: ৳{order.total}</p>
                        </div>
                        <p className="font-semibold capitalize px-3 py-1 rounded-full bg-primary/10 text-primary">{order.status}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No Orders Found</h2>
                <p className="text-muted-foreground">You have no orders with this status.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
