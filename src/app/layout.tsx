
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PabnaMart',
  description: 'Your one-stop shop for everything you need.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
