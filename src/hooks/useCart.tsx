
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
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
  shippingFee: number;
  selectedItemIds: number[];
  toggleSelectItem: (productId: number) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  selectedCartItems: CartItem[];
  selectedCartCount: number;
  selectedCartTotal: number;
  selectedShippingAddress: ShippingAddress | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const db = getFirestore(app);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const isInitialLoad = useRef(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { chargeInsidePabnaSmall, chargeInsidePabnaLarge, chargeOutsidePabnaSmall, chargeOutsidePabnaLarge } = useDeliveryCharge();
  const { getFlashSalePrice } = useProducts();
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<ShippingAddress | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const updateFirestoreCart = useCallback(async (uid: string, items: CartItem[], selectedIds: number[]) => {
      const cartRef = doc(db, 'carts', uid);
      await setDoc(cartRef, { items, selectedItemIds: selectedIds });
  }, []);

  useEffect(() => {
    if (user) {
      isInitialLoad.current = true;
      const cartRef = doc(db, 'carts', user.uid);
      const cartUnsubscribe = onSnapshot(cartRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const itemsFromDb = data.items || [];
          
          setCartItems(currentItems => {
            // Only update if the data from Firestore is different from the current state
            if (JSON.stringify(currentItems) !== JSON.stringify(itemsFromDb)) {
              return itemsFromDb;
            }
            return currentItems;
          });
          
          if (isInitialLoad.current) {
            if (data.selectedItemIds && Array.isArray(data.selectedItemIds)) {
                setSelectedItemIds(data.selectedItemIds);
            } else {
                setSelectedItemIds(itemsFromDb.map((item: CartItem) => item.id));
            }
            isInitialLoad.current = false;
          }
        } else {
          setCartItems([]);
          setSelectedItemIds([]);
          isInitialLoad.current = false;
        }
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const addresses = userData.shippingAddresses || [];
          const defaultAddr = addresses.find((a: ShippingAddress) => a.default) || addresses[0] || null;
          setSelectedShippingAddress(defaultAddr);
        } else {
            setSelectedShippingAddress(null);
        }
      });

      return () => {
          cartUnsubscribe();
          userUnsubscribe();
      };
    } else {
      setCartItems([]);
      setSelectedItemIds([]);
      setSelectedShippingAddress(null);
      isInitialLoad.current = true;
    }
  }, [user]);
  
  // Save to Firestore whenever selected items or cart items change
  useEffect(() => {
    if (!isInitialLoad.current && user) {
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

    setCartItems(prevCartItems => {
        const existingItem = prevCartItems.find(item => item.id === product.id);
        
        if (existingItem) {
          return prevCartItems.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        // Create a Firestore-compatible product object
        const productForCart: Product = { ...product };
        for (const key in productForCart) {
            if ((productForCart as any)[key] === undefined) {
                (productForCart as any)[key] = null;
            }
        }

        return [
            ...prevCartItems,
            { 
              ...productForCart, 
              quantity: 1,
              price,
              originalPrice: originalPrice ?? null,
            }
        ];
    });

    // Automatically select newly added item
    setSelectedItemIds(prevSelectedIds => {
        if (!prevSelectedIds.includes(product.id)) {
            return [...prevSelectedIds, product.id];
        }
        return prevSelectedIds;
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [user, toast, router, getFlashSalePrice]);

  const removeFromCart = useCallback((productId: number) => {
    if (!user) return;
    setCartItems(prev => prev.filter(item => item.id !== productId));
    setSelectedItemIds(prev => prev.filter(id => id !== productId));
    toast({
      title: "Removed from cart",
      description: `The item has been removed from your cart.`,
    });
  }, [user, toast]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
    ));
  }, [removeFromCart, user]);

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
    
    // Free shipping is applied only if *every* selected item is eligible for it.
    const allItemsHaveFreeShipping = selectedCartItems.every(item => item.freeShipping);
    if (allItemsHaveFreeShipping) {
      return 0;
    }

    const itemCount = selectedCartItems.reduce((total, item) => total + item.quantity, 0);
    const isInsidePabna = selectedShippingAddress?.city.toLowerCase().trim() === 'pabna';

    if (isInsidePabna) {
        return itemCount >= 1 && itemCount <= 5 ? chargeInsidePabnaSmall : chargeInsidePabnaLarge;
    } else {
        return itemCount >= 1 && itemCount <= 5 ? chargeOutsidePabnaSmall : chargeOutsidePabnaLarge;
    }

  }, [selectedCartItems, selectedCartCount, selectedShippingAddress, chargeInsidePabnaSmall, chargeInsidePabnaLarge, chargeOutsidePabnaSmall, chargeOutsidePabnaLarge]);

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
        selectedShippingAddress
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
