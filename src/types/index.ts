
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
  stock: number;
  details?: string;
  freeShipping?: boolean;
  shippingTime?: string;
  returnPolicy?: number;
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

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  status: 'active' | 'banned';
  joined: string;
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  userId: string;
}
