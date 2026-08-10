
"use client";

import Link from 'next/link';
import { Search, User, LogIn, Home, Bell, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';


function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    
    const targetPath = pathname === '/' ? '/products' : (pathname.startsWith('/products') ? pathname.split('/[')[0] : '/products');
    
    router.push(`${targetPath}?${params.toString()}`);
  };

  const isSimpleHeaderPage = 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/forgot-password' ||
    pathname === '/notifications' ||
    pathname === '/cart' ||
    pathname === '/checkout';

  if (isSimpleHeaderPage) {
    return (
      <div className="flex w-full items-center justify-center">
           <Link href="/">
              <span className="text-2xl font-bold text-primary whitespace-nowrap">PabnaMart</span>
          </Link>
      </div>
    );
  }

  return (
    <>
      <Link 
        href="/" 
        className={cn(
            "flex items-center gap-2 transition-all duration-300 ease-in-out",
            isSearchFocused ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}
        aria-hidden={isSearchFocused}
        tabIndex={isSearchFocused ? -1 : 0}
      >
        <span className="text-2xl font-bold text-primary whitespace-nowrap">PabnaMart</span>
      </Link>

      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isSearchFocused ? "max-w-full" : "max-w-xs md:max-w-md"
      )}>
        <form onSubmit={handleSearch} className="relative flex w-full">
            <Input
            type="search"
            placeholder="Search for products..."
            className="w-full rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            />
            <Button type="submit" className="rounded-l-none">
                <Search className="h-5 w-5" />
            </Button>
        </form>
      </div>
      
      <div className="hidden md:flex items-center gap-1 lg:gap-2 ml-4">
          <Button asChild variant="ghost" size="icon" className="relative group">
              <Link href="/">
                  <Home className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />
                  <span className="sr-only">Home</span>
              </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative group">
              <Link href="/notifications">
                  <Bell className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold border-2 border-background">
                        {unreadCount}
                      </span>
                  )}
                  <span className="sr-only">Notifications</span>
              </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative group">
              <Link href="/cart">
                  <ShoppingCart className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />
                  {cartCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold border-2 border-background">
                        {cartCount}
                      </span>
                  )}
                  <span className="sr-only">Cart</span>
              </Link>
          </Button>

          <div className="h-8 w-px bg-border mx-1" />

          <Button asChild variant="ghost" size="icon" className="group">
              <Link href={user ? "/account" : "/login"}>
                  {user ? <User className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" /> : <LogIn className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />}
                  <span className="sr-only">Account</span>
              </Link>
          </Button>
      </div>
    </>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4 transition-all duration-300">
        <HeaderContent />
      </div>
    </header>
  );
}
