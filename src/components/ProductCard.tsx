"use client";

import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Star, Truck, Heart, DollarSign } from 'lucide-react';
import { cn, rgbToHsl } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  isFlashSaleContext?: boolean;
  size?: 'default' | 'small';
  showCommission?: boolean;
}

export default function ProductCard({ product, isFlashSaleContext = false, size = 'default', showCommission = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const router = useRouter();
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

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
  
  const commissionAmount = product.affiliateCommission && product.price ? (product.price * product.affiliateCommission) / 100 : 0;

  const handleEarnClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/products/${product.id}`);
  };

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

  if (isSmall) {
    return (
      <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg group">
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
                  {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-white font-bold">Sold Out</span>
                      </div>
                  )}
              </div>
          </Link>
          <CardContent className="p-2 flex flex-col flex-grow">
              <h3 className="text-xs font-semibold text-gray-800 truncate-2-lines h-8 leading-tight mb-1">
                  <Link href={productLink} className="hover:text-primary">
                      {product.name}
                  </Link>
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="mx-0.5">|</span>
                  <span>Sold {product.sold || 0}</span>
              </div>

              <div className="flex justify-between items-center mt-auto">
                  <div>
                      <p className="text-sm font-bold text-primary">৳{price}</p>
                      {hasDiscount && (
                          <p className="text-xs text-muted-foreground line-through">
                              ৳{originalPrice}
                          </p>
                      )}
                  </div>
                  {isSoldOut ? (
                      <Button
                          onClick={handleWishlistClick}
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          disabled={isInWishlist(product.id)}
                          aria-label={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
                      >
                          <Heart className={cn("h-3.5 w-3.5", isInWishlist(product.id) && "fill-destructive text-destructive")} />
                      </Button>
                  ) : (
                      <Button
                          onClick={handleCartAction}
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Add to Cart"
                      >
                          <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                  )}
              </div>
              {showCommission && product.affiliateCommission && commissionAmount > 0 && (
                <div className="flex justify-between items-end mt-2 pt-2 border-t">
                    <div>
                        <span className="text-xs font-semibold border border-orange-400 text-orange-500 rounded px-1.5 py-0.5 whitespace-nowrap">
                            Comm. {product.affiliateCommission}%
                        </span>
                        <p className="text-orange-500 font-bold text-sm mt-1">৳{commissionAmount.toFixed(2)}</p>
                    </div>
                    <Button onClick={handleEarnClick} className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white h-7 px-3 text-xs self-end">Earn</Button>
                </div>
              )}
          </CardContent>
      </Card>
    );
  }

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
      <CardContent className="p-3 flex flex-col flex-grow space-y-2">
        <p className="text-xs text-muted-foreground truncate">{product.category}</p>
        <h3 className="text-sm h-10 font-semibold text-gray-800 leading-snug flex-grow">
            <Link href={productLink} className="hover:text-primary">
                <span className="truncate-2-lines">{product.name}</span>
            </Link>
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span>{product.rating.toFixed(1)}</span>
            <span>|</span>
            <span>Sold {product.sold || 0}</span>
        </div>
        <div className="flex justify-between items-center mt-auto">
          <div>
            <p className="text-lg font-bold text-primary">৳{price}</p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                ৳{originalPrice}
              </p>
            )}
          </div>
          {isSoldOut ? (
             <Button
                onClick={handleWishlistClick}
                size="icon"
                variant="outline"
                className="h-9 w-9"
                disabled={isInWishlist(product.id)}
                aria-label={isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}
            >
                <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-destructive text-destructive")} />
            </Button>
          ) : (
            <Button
                onClick={handleCartAction}
                size="icon"
                className="h-9 w-9"
                aria-label="Add to Cart"
            >
                <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showCommission && product.affiliateCommission && commissionAmount > 0 && (
            <div className="flex justify-between items-end mt-2 pt-2 border-t">
                <div>
                    <span className="text-xs font-semibold border border-orange-400 text-orange-500 rounded px-1.5 py-0.5 whitespace-nowrap">
                        Comm. {product.affiliateCommission}%
                    </span>
                    <p className="text-orange-500 font-bold text-sm mt-1">৳{commissionAmount.toFixed(2)}</p>
                </div>
                <Button onClick={handleEarnClick} className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white h-7 px-3 text-xs self-end">Earn</Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
