"use server";

import { getProductRecommendations as getProductRecommendationsFlow } from "@/ai/flows/product-recommendations";
import type { ProductRecommendationsInput, ProductRecommendationsOutput } from "@/ai/flows/product-recommendations";
import admin from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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
        // Delete from Firebase Authentication
        await admin.auth().deleteUser(uid);
        
        // Delete user document from Firestore
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.delete();
        
        return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, message: error.message || 'Failed to delete user.' };
    }
}
