
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { Product, Offer, Notification } from '@/types';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import { products as initialProducts } from '@/lib/products';
import { useOffers } from './useOffers';
import { PackageCheck } from 'lucide-react';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'>) => Promise<void>;
  updateProduct: (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const db = getFirestore(app);
const productsCollectionRef = collection(db, 'products');

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [baseProducts, setBaseProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeOffers } = useOffers();

  useEffect(() => {
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      if (snapshot.empty) {
        // If the collection is empty, populate it with initial products
        const batch = Promise.all(
          initialProducts.map(product => {
            const productDoc = doc(db, 'products', product.id.toString());
            return setDoc(productDoc, product);
          })
        );
        batch.then(() => {
          setBaseProducts(initialProducts);
          setLoading(false);
        });
      } else {
        const productsData = snapshot.docs.map(doc => doc.data() as Product);
        setBaseProducts(productsData);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching products:", error);
      setBaseProducts(initialProducts); // Fallback to initial products on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const productsWithOffers = useMemo(() => {
    if (!activeOffers.length) {
      return baseProducts.map(p => ({ ...p, originalPrice: p.originalPrice || p.price, hasOffer: false }));
    }

    return baseProducts.map(product => {
      const applicableOffer = activeOffers.find(offer => offer.name === product.category);
      if (applicableOffer) {
        const discountAmount = (product.price * applicableOffer.discount) / 100;
        return {
          ...product,
          originalPrice: product.price,
          price: product.price - discountAmount,
          hasOffer: true,
        };
      }
      return { ...product, originalPrice: product.originalPrice || p.price, hasOffer: false };
    });
  }, [baseProducts, activeOffers]);


  const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'>) => {
    const newId = new Date().getTime(); // Simple way to generate a unique ID
    const newProduct: Product = { 
      ...productData, 
      id: newId,
      rating: 0,
      reviews: [],
      sold: 0,
      isFlashSale: productData.isFlashSale || false,
      flashSaleEndDate: productData.flashSaleEndDate || '',
    };
    const productDoc = doc(db, 'products', newId.toString());
    await setDoc(productDoc, newProduct);
  };
  
  const sendStockNotifications = useCallback(async (product: Product) => {
      const wishlistsRef = collection(db, 'wishlists');
      const q = query(wishlistsRef, where('productIds', 'array-contains', product.id));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);

      querySnapshot.forEach(userDoc => {
          const userId = userDoc.id;
          const notification: Omit<Notification, 'id'> = {
              icon: PackageCheck,
              title: "Item Back in Stock!",
              description: `The item you wanted, "${product.name}", is now available.`,
              time: new Date().toLocaleDateString(),
              read: false,
              href: `/products/${product.id}`
          };
          const notificationRef = doc(collection(db, `users/${userId}/pendingNotifications`));
          batch.set(notificationRef, notification);
      });

      await batch.commit();

  }, []);

  const updateProduct = async (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews' | 'sold'>) => {
    const productDocRef = doc(db, 'products', productId.toString());
    const existingProduct = baseProducts.find(p => p.id === productId);

    if (existingProduct && existingProduct.stock === 0 && productData.stock > 0) {
        await sendStockNotifications(existingProduct);
    }
    
    const dataToUpdate = {
        ...productData,
        id: productId,
        rating: existingProduct?.rating || 0,
        reviews: existingProduct?.reviews || [],
        sold: existingProduct?.sold || 0,
        isFlashSale: productData.isFlashSale || false,
        flashSaleEndDate: productData.flashSaleEndDate || '',
    };
    await updateDoc(productDocRef, dataToUpdate);
  };


  const deleteProduct = async (productId: number) => {
    const productDoc = doc(db, 'products', productId.toString());
    await deleteDoc(productDoc);
  };

  return (
    <ProductContext.Provider value={{ products: productsWithOffers, addProduct, updateProduct, deleteProduct, loading }}>
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
