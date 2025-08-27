
"use client";

import Link from 'next/link';
import { Home, Bell, ShoppingCart, User, LogIn } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function BottomNav() {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', count: cartCount },
    { 
      href: user ? '/account' : '/login', 
      icon: user ? User : LogIn, 
      label: user ? 'Account' : 'Login' 
    },
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || (item.href !== '/' && pathname.startsWith(item.href));
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
                {item.label === 'Cart' && item.count > 0 && (
                   <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={cn("text-xs", { "font-bold": isActive })}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
