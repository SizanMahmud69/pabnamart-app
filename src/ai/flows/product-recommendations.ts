'use server';

/**
 * @fileOverview Recommends products to users based on their browsing history.
 *
 * - getProductRecommendations - A function that returns product recommendations based on browsing history.
 * - ProductRecommendationsInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationsOutput - The return type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationsInputSchema = z.object({
  browsingHistory: z
    .string()
    .describe('The browsing history of the user as a string.'),
  productCatalog: z
    .string()
    .describe('A list of products in the store, with title and description.'),
});
export type ProductRecommendationsInput = z.infer<typeof ProductRecommendationsInputSchema>;

const ProductRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('Up to three product recommendations based on the browsing history.'),
});
export type ProductRecommendationsOutput = z.infer<typeof ProductRecommendationsOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  return productRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productRecommendationsPrompt',
  input: {schema: ProductRecommendationsInputSchema},
  output: {schema: ProductRecommendationsOutputSchema},
  prompt: `You are an expert e-commerce product recommender.

  Based on the user's browsing history, recommend up to three products from the product catalog that the user might be interested in. Only recommend products that closely relate to the user's search history. If the browsing history is empty, or if there are no products that the user would be interested in, return an empty list.

  User's Browsing History: {{{browsingHistory}}}

  Product Catalog: {{{productCatalog}}}
  `,
});

const productRecommendationsFlow = ai.defineFlow(
  {
    name: 'productRecommendationsFlow',
    inputSchema: ProductRecommendationsInputSchema,
    outputSchema: ProductRecommendationsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      // If the model fails to return a valid output, it will be undefined.
      // In that case, we'll return an empty list of recommendations.
      if (!output) {
        return { recommendations: [] };
      }
      return output;
    } catch (error) {
      console.error("Error in productRecommendationsFlow:", error);
      // In case of an unexpected error, also return empty recommendations
      // to prevent the app from crashing.
      return { recommendations: [] };
    }
  }
);
