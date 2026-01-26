"use client";

import Link from 'next/link';
import { Home, Wallet, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function AffiliateBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/affiliate', icon: Home, label: 'Home' },
    { href: '/affiliate/wallet', icon: Wallet, label: 'Wallet' },
    { 
      href: user ? '/affiliate/account' : '/login', 
      icon: User, 
      label: 'Account' 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="grid h-16 grid-cols-3">
        {navItems.map((item) => {
          const isActive = (item.href === '/affiliate' && pathname === '/affiliate') || (item.href !== '/affiliate' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-muted group',
                isActive ? 'text-primary' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-6 w-6", { "fill-primary/20": isActive })} />
              </div>
              <span className={cn("text-xs", { "font-bold": isActive })}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
