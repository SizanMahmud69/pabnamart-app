
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import admin from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { CartItem, Order, OrderStatus, ShippingAddress } from "@/types";
import { revalidatePath } from "next/cache";

const db = getFirestore();

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  try {
    const recommendations = await getProductRecommendationsFlow(input);
    return recommendations;
  } catch (error) {
    console.error("Error in getProductRecommendations server action:", error);
    throw new Error("Failed to fetch product recommendations.");
  }
}

export async function deleteUserAccount(uid: string) {
    if (!uid) {
      return { success: false, message: 'User ID is missing.' };
    }
    try {
        await admin.auth().deleteUser(uid);
        
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.delete();
        
        return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, message: error.message || 'Failed to delete user.' };
    }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
  return `${timestamp}${randomPart}`;
}


export async function placeOrder(
  userId: string,
  cartItems: CartItem[],
  totalAmount: number,
  shippingAddress: Omit<ShippingAddress, 'id' | 'default'>,
  paymentMethod: string
) {
  if (!userId || !cartItems || cartItems.length === 0) {
    return { success: false, message: 'Invalid order data.' };
  }

  try {
    const orderRef = db.collection('orders').doc();
    
    let status: OrderStatus = 'pending';
    if (paymentMethod === 'cod') {
        status = 'shipped';
    } else if (paymentMethod === 'online') {
        status = 'pending'; 
    }

    const orderData: Omit<Order, 'id'> = {
      orderNumber: generateOrderNumber(),
      userId,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images[0]
      })),
      total: totalAmount,
      status: status,
      date: Timestamp.now().toDate().toISOString(),
      shippingAddress,
      paymentMethod,
    };

    await orderRef.set(orderData);
    
    // Clear cart after order is placed, regardless of payment method
    const cartRef = db.collection('carts').doc(userId);
    await cartRef.set({ items: [] });
    
    revalidatePath('/account/orders');
    revalidatePath('/admin/orders');

    return { success: true, message: 'Order placed successfully.', orderId: orderRef.id };
  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, message: error.message || 'Failed to place order.' };
  }
}
