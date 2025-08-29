
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import type { CartItem, Product, ShippingAddress } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useDeliveryCharge } from './useDeliveryCharge';
import { useProducts } from './useProducts';
import { useRouter, usePathname } from 'next/navigation';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, isFlashSaleContext?: boolean) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  shippingFee: number | null;
  selectedItemIds: number[];
  toggleSelectItem: (productId: number) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  selectedCartItems: CartItem[];
  selectedCartCount: number;
  selectedCartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const db = getFirestore(app);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { chargeInsidePabnaSmall, chargeInsidePabnaLarge, chargeOutsidePabnaSmall, chargeOutsidePabnaLarge } = useDeliveryCharge();
  const { getFlashSalePrice } = useProducts();
  const [defaultAddress, setDefaultAddress] = useState<ShippingAddress | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const updateFirestoreCart = useCallback(async (uid: string, items: CartItem[], selectedIds: number[]) => {
      const cartRef = doc(db, 'carts', uid);
      await setDoc(cartRef, { items, selectedItemIds: selectedIds });
  }, []);

  useEffect(() => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      const cartUnsubscribe = onSnapshot(cartRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCartItems(data.items || []);
          // On first load, select all items by default
          if (data.items && data.items.length > 0 && selectedItemIds.length === 0) {
              setSelectedItemIds(data.items.map((item: CartItem) => item.id));
          } else {
              setSelectedItemIds(data.selectedItemIds || []);
          }
        } else {
          setCartItems([]);
          setSelectedItemIds([]);
        }
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const addresses = userData.shippingAddresses || [];
          const defaultAddr = addresses.find((a: ShippingAddress) => a.default) || addresses[0] || null;
          setDefaultAddress(defaultAddr);
        } else {
            setDefaultAddress(null);
        }
      });

      return () => {
          cartUnsubscribe();
          userUnsubscribe();
      };
    } else {
      setCartItems([]);
      setSelectedItemIds([]);
      setDefaultAddress(null);
    }
  }, [user]);
  
  // Save to Firestore whenever selected items change
  useEffect(() => {
    if (user) {
      updateFirestoreCart(user.uid, cartItems, selectedItemIds);
    }
  }, [selectedItemIds, cartItems, user, updateFirestoreCart]);

  const addToCart = useCallback((product: Product, isFlashSaleContext = false) => {
    if (!user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to add items to your cart.",
            variant: "destructive"
        });
        router.push('/login');
        return;
    }

    const price = isFlashSaleContext ? getFlashSalePrice(product) : product.price;
    const originalPrice = product.originalPrice;

    const newCartItems = [...cartItems];
    let newSelectedItemIds = [...selectedItemIds];
    const existingItem = newCartItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
      if (isFlashSaleContext) {
          existingItem.price = price;
          existingItem.originalPrice = originalPrice;
      }
    } else {
      newCartItems.push({ 
          ...product, 
          quantity: 1,
          price,
          originalPrice,
      });
      // Automatically select newly added item
      if (!newSelectedItemIds.includes(product.id)) {
          newSelectedItemIds.push(product.id);
      }
    }
    setCartItems(newCartItems);
    setSelectedItemIds(newSelectedItemIds);
    // Firestore update is handled by useEffect
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [cartItems, selectedItemIds, user, toast, router, getFlashSalePrice]);

  const removeFromCart = useCallback((productId: number) => {
    if (!user) return;
    const newCartItems = cartItems.filter(item => item.id !== productId);
    const newSelectedItemIds = selectedItemIds.filter(id => id !== productId);
    setCartItems(newCartItems);
    setSelectedItemIds(newSelectedItemIds);
    toast({
      title: "Removed from cart",
      description: `The item has been removed from your cart.`,
    });
  }, [cartItems, selectedItemIds, user, toast]);

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
  }, [cartItems, removeFromCart, user]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    const itemsToKeep = cartItems.filter(item => !selectedItemIds.includes(item.id));
    const newSelectedItemIds: number[] = [];
    setCartItems(itemsToKeep);
    setSelectedItemIds(newSelectedItemIds);
    
    // Clear only the selected items from the cart for the user in firestore
    const cartRef = doc(db, 'carts', user.uid);
    await setDoc(cartRef, { items: itemsToKeep, selectedItemIds: newSelectedItemIds });

  }, [user, cartItems, selectedItemIds]);

  const toggleSelectItem = (productId: number) => {
      setSelectedItemIds(prev => 
          prev.includes(productId) 
              ? prev.filter(id => id !== productId) 
              : [...prev, productId]
      );
  };
  
  const isAllSelected = useMemo(() => cartItems.length > 0 && selectedItemIds.length === cartItems.length, [cartItems, selectedItemIds]);

  const toggleSelectAll = () => {
      if (isAllSelected) {
          setSelectedItemIds([]);
      } else {
          setSelectedItemIds(cartItems.map(item => item.id));
      }
  };

  const selectedCartItems = useMemo(() => cartItems.filter(item => selectedItemIds.includes(item.id)), [cartItems, selectedItemIds]);
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const selectedCartCount = selectedCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const selectedCartTotal = selectedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shippingFee = useMemo(() => {
    if (selectedCartCount === 0) return 0;
    
    const hasFreeShippingItem = selectedCartItems.some(item => item.freeShipping);
    if (hasFreeShippingItem) {
      return 0;
    }

    const itemCount = selectedCartItems.length;
    const isInsidePabna = defaultAddress?.city.toLowerCase().trim() === 'pabna';

    if (isInsidePabna) {
        return itemCount >= 1 && itemCount <= 5 ? chargeInsidePabnaSmall : chargeInsidePabnaLarge;
    } else {
        return itemCount >= 1 && itemCount <= 5 ? chargeOutsidePabnaSmall : chargeOutsidePabnaLarge;
    }

  }, [selectedCartItems, selectedCartCount, defaultAddress, chargeInsidePabnaSmall, chargeInsidePabnaLarge, chargeOutsidePabnaSmall, chargeOutsidePabnaLarge]);

  // When navigating to checkout, save selected items to session storage
  useEffect(() => {
    if (pathname === '/checkout') {
      sessionStorage.setItem('checkoutItems', JSON.stringify(selectedCartItems));
    }
  }, [pathname, selectedCartItems]);

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
        selectedItemIds,
        toggleSelectItem,
        toggleSelectAll,
        isAllSelected,
        selectedCartItems,
        selectedCartCount,
        selectedCartTotal,
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
