
"use client";

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

export default function ShoppingCartSheet({ children }: { children: ReactNode }) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-grow pr-4">
              <div className="flex flex-col gap-4 py-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                       <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ৳{item.price.toFixed(2)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e =>
                            updateQuantity(item.id, parseInt(e.target.value))
                          }
                          className="h-8 w-16"
                          aria-label={`Quantity for ${item.name}`}
                        />
                         <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Remove {item.name}</span>
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold">
                      ৳{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto border-t pt-4">
              <div className="flex w-full flex-col gap-4">
                <div className="flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span>৳{cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Proceed to Checkout
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-grow flex-col items-center justify-center text-center">
            <p className="text-lg text-muted-foreground">Your cart is empty.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
