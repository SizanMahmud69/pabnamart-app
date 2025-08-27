
"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FormEvent, useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    // Update search query in header if it changes in URL, e.g. via navigation
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

    // If we are already on a products page, stay there. Otherwise, go to the main products page.
    const targetPath = pathname.startsWith('/products') ? pathname.split('/[')[0] : '/products';
    
    router.push(`${targetPath}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">PabnaMart</span>
        </Link>

        <div className="flex-1">
           <form onSubmit={handleSearch} className="relative flex w-full">
            <Input
              type="search"
              placeholder="Search for products..."
              className="w-full rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none">
                <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
