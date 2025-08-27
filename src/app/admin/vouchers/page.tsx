import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AdminVoucherManagement() {
  return (
    <div className="container mx-auto p-4">
        <header className="py-4">
            <Button asChild variant="outline">
                <Link href="/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </header>
        <main>
            <Card>
                <CardHeader>
                    <CardTitle>Voucher Management</CardTitle>
                    <CardDescription>This feature is under construction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Here you will be able to create and distribute vouchers for your customers.</p>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
