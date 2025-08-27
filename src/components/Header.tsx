
"use client";

import Link from 'next/link';
import { Search, User, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user } = useAuth();

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

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4 transition-all duration-300">
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
          isSearchFocused ? "max-w-full" : "max-w-xs"
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
        <div className="hidden md:flex items-center">
            <Button asChild variant="ghost" size="icon">
                <Link href={user ? "/account" : "/login"}>
                    {user ? <User /> : <LogIn />}
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
