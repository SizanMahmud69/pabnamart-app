
"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import admin from '@/lib/firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { CartItem, Order, OrderStatus, ShippingAddress, PaymentDetails, Voucher, Product } from "@/types";
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
  paymentMethod: string,
  paymentDetails?: PaymentDetails,
  usedVoucher?: Voucher | null,
  voucherDiscount?: number | null,
) {
  if (!userId || !cartItems || cartItems.length === 0) {
    return { success: false, message: 'Invalid order data.' };
  }

  try {
     const orderRef = db.collection('orders').doc();
     const productRefs = cartItems.map(item => db.collection('products').doc(item.id.toString()));

     await db.runTransaction(async (transaction) => {
        const productDocs = await transaction.getAll(...productRefs);
        const productsData: { [id: number]: Product } = {};
        productDocs.forEach(doc => {
            if (doc.exists) {
                productsData[Number(doc.id)] = doc.data() as Product;
            }
        });

        // 1. Update product stock and sold count
        for (const item of cartItems) {
            const productRef = db.collection('products').doc(item.id.toString());
            const productData = productsData[item.id];

            if (!productData) {
                throw new Error(`Product with ID ${item.id} not found.`);
            }

            const newStock = (productData.stock || 0) - item.quantity;
            const newSoldCount = (productData.sold || 0) + item.quantity;

            if (newStock < 0) {
                throw new Error(`Not enough stock for ${item.name}.`);
            }

            transaction.update(productRef, { stock: newStock, sold: newSoldCount });
        }

        // 2. Create the order document
        let status: OrderStatus = 'pending';
        if (paymentMethod === 'cod') {
            status = 'processing';
        } else if (paymentMethod === 'online') {
            status = 'pending'; 
        }

        const orderData: Omit<Order, 'id'> = {
          orderNumber: generateOrderNumber(),
          userId,
          items: cartItems.map(item => {
            const productData = productsData[item.id];
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.images[0],
              returnPolicy: productData?.returnPolicy ?? 0, // Default to 0 if undefined
            }
          }),
          total: totalAmount,
          status: status,
          date: Timestamp.now().toDate().toISOString(),
          shippingAddress,
          paymentMethod,
          isReviewed: false,
          ...(usedVoucher && { usedVoucherCode: usedVoucher.code }),
          ...(voucherDiscount && { voucherDiscount: voucherDiscount }),
          ...(paymentDetails && { paymentDetails }),
        };
        transaction.set(orderRef, orderData);

        // 3. Clear user's cart
        const cartRef = db.collection('carts').doc(userId);
        transaction.set(cartRef, { items: [] });
        
        // 4. Handle used voucher
        if (usedVoucher) {
            // Add voucher code to user's used voucher list for both regular and return vouchers
            const userRef = db.collection('users').doc(userId);
            transaction.update(userRef, {
                usedVoucherCodes: FieldValue.arrayUnion(usedVoucher.code)
            });
        }
     });
    
    revalidatePath('/account/orders');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/verify-payment');

    return { success: true, message: 'Order placed successfully.', orderId: orderRef.id };
  } catch (error: any) {
    console.error("Error placing order:", error);
    return { success: false, message: error.message || 'Failed to place order.' };
  }
}
