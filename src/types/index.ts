
import type { LucideIcon } from "lucide-react";

export interface Review {
  user: string;
  comment: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: string;
  images: string[];
  reviews: Review[];
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Voucher {
    code: string;
    discount: number;
    type: 'fixed' | 'percentage';
    description: string;
    minSpend?: number;
    discountType?: 'order' | 'shipping';
}

export interface Notification {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    time: string;
    read: boolean;
    href?: string;
}
