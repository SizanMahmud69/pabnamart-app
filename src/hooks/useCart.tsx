
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import type { CartItem, Product } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useDeliveryCharge } from './useDeliveryCharge';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  shippingFee: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const db = getFirestore(app);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { chargeOutsidePabna } = useDeliveryCharge();

  const updateFirestoreCart = useCallback(async (items: CartItem[]) => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      await setDoc(cartRef, { items });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      const unsubscribe = onSnapshot(cartRef, (docSnap) => {
        if (docSnap.exists()) {
          setCartItems(docSnap.data().items || []);
        } else {
          setCartItems([]);
        }
      });
      return () => unsubscribe();
    } else {
      // Clear cart for logged-out users
      setCartItems([]);
    }
  }, [user]);

  const addToCart = useCallback((product: Product) => {
    if (!user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to add items to your cart.",
            variant: "destructive"
        });
        return;
    }

    const newCartItems = [...cartItems];
    const existingItem = newCartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCartItems.push({ ...product, quantity: 1 });
    }
    setCartItems(newCartItems);
    updateFirestoreCart(newCartItems);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [cartItems, updateFirestoreCart, toast, user]);

  const removeFromCart = useCallback((productId: number) => {
    if (!user) return;
    const newCartItems = cartItems.filter(item => item.id !== productId);
    setCartItems(newCartItems);
    updateFirestoreCart(newCartItems);
    toast({
      title: "Removed from cart",
      description: `The item has been removed from your cart.`,
    });
  }, [cartItems, updateFirestoreCart, toast, user]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCartItems = cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
    );
    setCartItems(newCartItems);
    updateFirestoreCart(newCartItems);
  }, [cartItems, removeFromCart, updateFirestoreCart, user]);

  const clearCart = useCallback(() => {
    if (!user) return;
    setCartItems([]);
    updateFirestoreCart([]);
  }, [user, updateFirestoreCart]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shippingFee = useMemo(() => {
    if (cartCount === 0) return 0;
    
    // If any item in the cart has free shipping, the entire order gets free shipping.
    const hasFreeShippingItem = cartItems.some(item => item.freeShipping);
    if (hasFreeShippingItem) {
      return 0;
    }
    
    // The final fee is calculated at checkout based on address.
    // Here, we show a default/placeholder fee.
    return chargeOutsidePabna;
  }, [cartItems, cartCount, chargeOutsidePabna]);


  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        shippingFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
