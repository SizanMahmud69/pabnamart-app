
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Product, Offer, Notification } from '@/types';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch, getDocs, query, where, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useOffers } from './useOffers';
import { PackageCheck } from 'lucide-react';
import { createAndSendNotification } from '@/app/actions';
import { useAuth } from './useAuth';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold' | 'createdAt'>) => Promise<void>;
  updateProduct: (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold' | 'createdAt'>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  loading: boolean;
  getFlashSaleProducts: () => { products: Product[], closestExpiry: string | null };
  getFlashSalePrice: (product: Product) => number;
  flashSalePopupProduct: Product | null;
  markFlashSaleAsSeen: (productId: number) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const roundPrice = (price: number): number => {
    const decimalPart = price - Math.floor(price);
    if (decimalPart > 0 && decimalPart <= 0.50) {
        return Math.floor(price);
    }
    return Math.round(price);
};

// Helper function to convert undefined to null recursively
const convertUndefinedToNull = (obj: any) => {
    if (obj === null || obj === undefined) {
        return null;
    }
    if (Array.isArray(obj)) {
        return obj.map(v => convertUndefinedToNull(v));
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                newObj[key] = value === undefined ? null : convertUndefinedToNull(value);
            }
        }
        return newObj;
    }
    return obj;
};


export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [baseProducts, setBaseProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashSalePopupProduct, setFlashSalePopupProduct] = useState<Product | null>(null);
  const { activeOffers } = useOffers();
  const { user } = useAuth();

  useEffect(() => {
    if (!app) {
        setLoading(false);
        return;
    }
    const db = getFirestore(app);
    const productsCollectionRef = collection(db, 'products');
    const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setBaseProducts(productsData);
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setBaseProducts([]); // Fallback to empty array on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const productsWithOffers = useMemo(() => {
    return baseProducts.map(product => {
      const applicableOffer = activeOffers.find(offer => offer.name === product.category);
      if (applicableOffer) {
        const basePriceForOffer = product.originalPrice || product.price;
        return {
          ...product,
          originalPrice: roundPrice(basePriceForOffer),
          price: roundPrice(basePriceForOffer - (basePriceForOffer * applicableOffer.discount) / 100),
          hasOffer: true,
        };
      }
      return { ...product, price: roundPrice(product.price), originalPrice: product.originalPrice ? roundPrice(product.originalPrice) : undefined };
    });
  }, [baseProducts, activeOffers]);
  
  const getFlashSalePrice = useCallback((product: Product): number => {
    const now = new Date();
    const baseProduct = baseProducts.find(p => p.id === product.id);

    if (
        baseProduct &&
        baseProduct.isFlashSale && 
        baseProduct.flashSaleEndDate && 
        new Date(baseProduct.flashSaleEndDate) > now && 
        baseProduct.flashSaleDiscount
    ) {
        const originalPriceForFlashSale = baseProduct.originalPrice ?? baseProduct.price;
        const discountAmount = (originalPriceForFlashSale * baseProduct.flashSaleDiscount) / 100;
        return roundPrice(originalPriceForFlashSale - discountAmount);
    }
    
    // If not a flash sale, return the price with category offer or the regular price
    const productWithCategoryOffer = productsWithOffers.find(p => p.id === product.id);
    return productWithCategoryOffer ? productWithCategoryOffer.price : roundPrice(product.price);
  }, [baseProducts, productsWithOffers]);

  const getFlashSaleProducts = useCallback(() => {
    const now = new Date();
    const saleProducts = productsWithOffers
      .filter(p => p.isFlashSale && p.flashSaleEndDate && new Date(p.flashSaleEndDate) > now)
      .map(p => {
        const flashPrice = getFlashSalePrice(p);
        const baseProduct = baseProducts.find(bp => bp.id === p.id);
        
        const originalPrice = baseProduct ? (baseProduct.originalPrice || baseProduct.price) : (p.originalPrice || p.price);
        
        return {
          ...p,
          originalPrice: roundPrice(originalPrice),
          price: flashPrice,
        };
      });

    let closestExpiry = null;
    if (saleProducts.length > 0) {
      closestExpiry = saleProducts.reduce((closest, current) => {
        if (!closest.flashSaleEndDate || !current.flashSaleEndDate) return closest;
        const closestTime = new Date(closest.flashSaleEndDate).getTime();
        const currentTime = new Date(current.flashSaleEndDate).getTime();
        return currentTime < closestTime ? current : closest;
      }).flashSaleEndDate || null;
    }

    return { products: saleProducts, closestExpiry };
  }, [productsWithOffers, getFlashSalePrice, baseProducts]);

    // Logic for new flash sale popup
    useEffect(() => {
        const { products: saleProducts } = getFlashSaleProducts();
        if (user && saleProducts.length > 0) {
            const seenProducts = JSON.parse(localStorage.getItem(`seenFlashSales_${user.uid}`) || '[]');
            const unseenSaleProducts = saleProducts.filter(p => !seenProducts.includes(p.id));

            if (unseenSaleProducts.length > 0) {
                const randomIndex = Math.floor(Math.random() * unseenSaleProducts.length);
                setFlashSalePopupProduct(unseenSaleProducts[randomIndex]);
            } else {
                setFlashSalePopupProduct(null);
            }
        } else {
            setFlashSalePopupProduct(null);
        }
    }, [getFlashSaleProducts, user]);

    const markFlashSaleAsSeen = useCallback((productId: number) => {
        if (!user) return;
        const seenProducts = JSON.parse(localStorage.getItem(`seenFlashSales_${user.uid}`) || '[]');
        if (!seenProducts.includes(productId)) {
            const newSeenProducts = [...seenProducts, productId];
            localStorage.setItem(`seenFlashSales_${user.uid}`, JSON.stringify(newSeenProducts));
        }
        setFlashSalePopupProduct(null);
    }, [user]);

  const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold' | 'createdAt'>) => {
    if (!app) return;
    const db = getFirestore(app);
    const newId = new Date().getTime(); 
    const newProduct: Product = { 
      ...productData, 
      id: newId,
      rating: 0,
      reviews: [],
      sold: 0,
      createdAt: new Date().toISOString(),
    };
    const productDoc = doc(db, 'products', newId.toString());
    const sanitizedProduct = convertUndefinedToNull(newProduct);
    await setDoc(productDoc, sanitizedProduct);
  };
  
  const sendStockNotifications = useCallback(async (product: Product) => {
      if (!app) return;
      const db = getFirestore(app);
      const wishlistsRef = collection(db, 'wishlists');
      const q = query(wishlistsRef, where('productIds', 'array-contains', product.id));
      const querySnapshot = await getDocs(q);

      const notificationPromises = querySnapshot.docs.map(userDoc => {
          const userId = userDoc.id;
          return createAndSendNotification(userId, {
              icon: 'PackageCheck',
              title: "Item Back in Stock!",
              description: `The item you wanted, "${product.name}", is now available.`,
              href: `/products/${product.id}`
          });
      });

      await Promise.all(notificationPromises);

  }, []);

  const updateProduct = async (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold' | 'createdAt'>) => {
    if (!app) return;
    const db = getFirestore(app);
    const productDocRef = doc(db, 'products', productId.toString());
    const existingProduct = baseProducts.find(p => p.id === productId);

    if (existingProduct && existingProduct.stock === 0 && productData.stock > 0) {
        await sendStockNotifications(existingProduct);
    }
    
    const dataToUpdate = {
        ...productData,
    };

    const sanitizedData = convertUndefinedToNull(dataToUpdate);
    await updateDoc(productDocRef, sanitizedData);
  };


  const deleteProduct = async (productId: number) => {
    if (!app) return;
    const db = getFirestore(app);
    const productDoc = doc(db, 'products', productId.toString());
    await deleteDoc(productDoc);
  };

  return (
    <ProductContext.Provider value={{ 
        products: productsWithOffers, 
        addProduct, 
        updateProduct, 
        deleteProduct, 
        loading, 
        getFlashSaleProducts, 
        getFlashSalePrice,
        flashSalePopupProduct,
        markFlashSaleAsSeen
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
