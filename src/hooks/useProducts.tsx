
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Product } from '@/types';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { products as initialProducts } from '@/lib/products';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews'>) => Promise<void>;
  updateProduct: (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews'>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const db = getFirestore(app);
const productsCollectionRef = collection(db, 'products');

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
          setProducts(initialProducts);
          setLoading(false);
        });
      } else {
        const productsData = snapshot.docs.map(doc => doc.data() as Product);
        setProducts(productsData);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching products:", error);
      setProducts(initialProducts); // Fallback to initial products on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviews'>) => {
    const newId = new Date().getTime(); // Simple way to generate a unique ID
    const newProduct: Product = { 
      ...productData, 
      id: newId,
      rating: 0,
      reviews: [] 
    };
    const productDoc = doc(db, 'products', newId.toString());
    await setDoc(productDoc, newProduct);
  };

  const updateProduct = async (productId: number, productData: Omit<Product, 'id' | 'rating' | 'reviews'>) => {
    const productDoc = doc(db, 'products', productId.toString());
    // We keep the original rating and reviews
    const existingProduct = products.find(p => p.id === productId);
    const dataToUpdate = {
        ...productData,
        id: productId,
        rating: existingProduct?.rating || 0,
        reviews: existingProduct?.reviews || []
    };
    await updateDoc(productDoc, dataToUpdate);
  };


  const deleteProduct = async (productId: number) => {
    const productDoc = doc(db, 'products', productId.toString());
    await deleteDoc(productDoc);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, loading }}>
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
