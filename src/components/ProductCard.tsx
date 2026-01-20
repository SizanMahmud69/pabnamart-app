
"use client";

import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Star, Truck, Heart } from 'lucide-react';
import { cn, rgbToHsl } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
  isFlashSaleContext?: boolean;
  size?: 'default' | 'small';
}

export default function ProductCard({ product, isFlashSaleContext = false, size = 'default' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const router = useRouter();

  const price = product.price;
  const originalPrice = product.originalPrice;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountAmount = hasDiscount ? originalPrice - price : 0;
  const isSoldOut = product.stock === 0;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToWishlist(product);
  };

  const hasVariants = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0);
  const productLink = isFlashSaleContext ? `/products/${product.id}?flash=true` : `/products/${product.id}`;

  const handleCartAction = (e: React.MouseEvent) => {
      e.preventDefault();
      if (hasVariants) {
          router.push(`${productLink}#variations`);
      } else {
          addToCart(product, {}, isFlashSaleContext);
      }
  }

  const isSmall = size === 'small';

  const defaultImage = "https://i.ibb.co/gV28rC7/default-image.jpg";
  let imageUrl = product.images?.[0] || defaultImage;

  try {
    if (imageUrl) new URL(imageUrl);
  } catch (e) {
    imageUrl = defaultImage;
  }
  
  useEffect(() => {
    setCardStyle({}); // Reset style for new product/image
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1;
      canvas.height = 1;

      // Draw the center of the image onto the 1x1 canvas to get an average color
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;
      ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 1, 1);
      
      try {
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const [h, s, l] = rgbToHsl(r, g, b);

        // Check if the color is not too gray/white/black to avoid bland backgrounds
        if (s > 10 && l < 95 && l > 5) { 
          setCardStyle({
            backgroundColor: `hsl(${h}, 50%, 96%)`,
          });
        }
      } catch (e) {
        console.error(`CORS error getting image data for ${imageUrl}. Cannot extract color.`, e);
      }
    };
    img.onerror = () => {
      // Failed to load image, do nothing, card will have default background
    };
  }, [imageUrl]);


  return (
    <Card 
      className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg group"
      style={cardStyle}
    >
       <Link href={productLink} className="block">
        <div className="relative w-full overflow-hidden bg-muted aspect-square">
          <img
            src={imageUrl}
            alt={product.name}
            className={cn(
              "object-cover w-full h-full transition-transform duration-300 group-hover:scale-105",
              isSoldOut && "filter grayscale"
            )}
            data-ai-hint="product lifestyle"
            loading="lazy"
          />
           {hasDiscount && !isSoldOut && discountAmount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              - ৳{discountAmount.toFixed(0)}
            </div>
          )}
          {isSoldOut && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-white text-lg font-bold">Sold Out</span>
            </div>
          )}
           {product.freeShipping && !isSoldOut && !isSmall && (
            <div className="absolute bottom-2 left-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                <Truck className="h-3 w-3" />
                <span>Free Delivery</span>
            </div>
        )}
        </div>
      </Link>
      <CardContent className={cn("flex flex-col flex-grow space-y-2", isSmall ? "p-2" : "p-3")}>
        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
        <h3 
          className={cn(
              "font-semibold text-gray-800 leading-snug flex-grow", 
              isSmall ? "text-xs h-8" : "text-sm h-10"
          )}
        >
            <Link href={productLink} className="hover:text-primary">
                <span className="truncate-2-lines">{product.name}</span>
            </Link>
        </h3>
        {isSmall ? (
             <div className="flex items-center justify-around text-xs text-muted-foreground">
                <div className="text-center flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span>{product.rating.toFixed(1)}</span>
                </div>
                <div className="text-center">
                    <span className="font-semibold">Sold</span>
                    <p>{product.sold || 0}</p>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span>{product.rating.toFixed(1)}</span>
                <span>|</span>
                <span>Sold {product.sold || 0}</span>
            </div>
        )}
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className={cn("font-bold text-primary", isSmall ? "text-base" : "text-lg")}>৳{price}</p>
            {hasDiscount && (
              <p className={cn("text-muted-foreground line-through", isSmall ? "text-[10px]" : "text-xs")}>
                ৳{originalPrice}
              </p>
            )}
          </div>
          {isSoldOut ? (
             <Button
                onClick={handleWishlistClick}
                size="icon"
                variant="outline"
                className={cn(isSmall ? "h-7 w-7" : "h-9 w-9")}
                disabled={isInWishlist(product.id)}
                aria-label={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
            >
                <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-destructive text-destructive")} />
            </Button>
          ) : (
            <Button
                onClick={handleCartAction}
                size="icon"
                className={cn(isSmall ? "h-7 w-7" : "h-9 w-9")}
                aria-label="Add to Cart"
            >
                <ShoppingCart className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
