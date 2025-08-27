
import Link from 'next/link';
import { Shirt, Heart, ShoppingBasket, Smartphone, Tv2, Laptop } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  { name: "Men's Fashion", icon: Shirt, href: "/category/Men's Fashion", color: "bg-blue-100 text-blue-600" },
  { name: "Women's Fashion", icon: Shirt, href: "/category/Women's Fashion", color: "bg-purple-100 text-purple-600" },
  { name: "Cosmetics", icon: Heart, href: "/category/Cosmetics", color: "bg-pink-100 text-pink-600" },
  { name: "Groceries", icon: ShoppingBasket, href: "/category/Groceries", color: "bg-green-100 text-green-600" },
  { name: "Mobile & Computers", icon: Laptop, href: "/category/Mobile & Computers", color: "bg-cyan-100 text-cyan-600" },
  { name: "Electronics", icon: Tv2, href: "/category/Electronics", color: "bg-indigo-100 text-indigo-600" },
];

export default function Categories() {
  return (
    <Card className="bg-purple-50/30">
        <CardContent className="p-4">
            <h2 className="text-2xl font-bold mb-4">Categories</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
                {categories.map((category) => (
                    <Link href={category.href} key={category.name} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-purple-100/50 transition-colors">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${category.color}`}>
                            <category.icon className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium whitespace-pre-line">{category.name}</span>
                    </Link>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
