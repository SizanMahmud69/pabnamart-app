
"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Product } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './useAuth';
import { getFirestore, doc, onSnapshot, setDoc, arrayUnion, arrayRemove, getDoc, type Firestore } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useProducts } from './useProducts';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistItemIds: number[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [wishlistItemIds, setWishlistItemIds] = useState<number[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { products } = useProducts();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (app) {
      setDb(getFirestore(app));
    }
  }, []);

  useEffect(() => {
    if (user && db) {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const unsubscribe = onSnapshot(wishlistRef, (docSnap) => {
        if (docSnap.exists()) {
          const ids = docSnap.data().productIds || [];
          setWishlistItemIds(ids);
          const items = products.filter(p => ids.includes(p.id));
          setWishlistItems(items);
        } else {
          setWishlistItemIds([]);
          setWishlistItems([]);
        }
      });
      return () => unsubscribe();
    } else {
      setWishlistItemIds([]);
      setWishlistItems([]);
    }
  }, [user, products, db]);

  const addToWishlist = useCallback(async (product: Product) => {
    if (!user) {
        toast({
            title: "Please log in",
            description: "You need to be logged in to add items to your wishlist.",
            variant: "destructive"
        });
        return;
    }
    if (!db) return;

    const wishlistRef = doc(db, 'wishlists', user.uid);
    try {
        const docSnap = await getDoc(wishlistRef);
        if (docSnap.exists()) {
            await setDoc(wishlistRef, { productIds: arrayUnion(product.id) }, { merge: true });
        } else {
            await setDoc(wishlistRef, { productIds: [product.id] });
        }
        toast({
            title: "Added to Wishlist",
            description: `${product.name} has been added to your wishlist.`,
        });
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        toast({ title: "Error", description: "Could not add item to wishlist.", variant: "destructive" });
    }
  }, [user, toast, db]);

  const removeFromWishlist = useCallback(async (productId: number) => {
    if (!user || !db) return;
    const wishlistRef = doc(db, 'wishlists', user.uid);
    try {
      await setDoc(wishlistRef, { productIds: arrayRemove(productId) }, { merge: true });
      toast({
        title: "Removed from Wishlist",
        description: "The item has been removed from your wishlist.",
      });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        toast({ title: "Error", description: "Could not remove item from wishlist.", variant: "destructive" });
    }
  }, [user, toast, db]);
  
  const isInWishlist = useCallback((productId: number) => {
    return wishlistItemIds.includes(productId);
  }, [wishlistItemIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistItemIds,
        addToWishlist,
        removeFromWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
