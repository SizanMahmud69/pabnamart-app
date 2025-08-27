"use client";

import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleBuyNow = () => {
    addToCart(product);
    router.push('/checkout');
  }

  return (
    <div className="flex gap-4">
      <Button size="lg" className="w-full" onClick={() => addToCart(product)}>
        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
      </Button>
      <Button size="lg" variant="outline" className="w-full" onClick={handleBuyNow}>
        <CreditCard className="mr-2 h-5 w-5" /> Buy Now
      </Button>
    </div>
  );
}
