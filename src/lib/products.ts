import type { Product } from '@/types';

export const products: Product[] = [
  {
    id: 1,
    name: 'Classic Leather Watch',
    description:
      'A timeless piece that combines classic design with modern functionality. Featuring a genuine leather strap and a stainless steel case, this watch is perfect for any occasion.',
    price: 150.0,
    rating: 4.5,
    category: 'Accessories',
    stock: 10,
    images: [
      'https://picsum.photos/seed/watch1/600/600',
      'https://picsum.photos/seed/watch2/600/600',
      'https://picsum.photos/seed/watch3/600/600',
    ],
    reviews: [
      { user: 'Alex', comment: 'Absolutely love this watch! Great quality and looks amazing.' },
      { user: 'Maria', comment: 'Very stylish and comfortable to wear.' },
    ],
  },
  {
    id: 2,
    name: 'Wireless Bluetooth Headphones',
    description:
      'Experience immersive sound with these high-fidelity wireless headphones. With up to 20 hours of battery life and a comfortable over-ear design, they are perfect for music lovers.',
    price: 99.99,
    rating: 4.8,
    category: 'Electronics',
    stock: 0,
    images: [
      'https://picsum.photos/seed/headphones1/600/600',
      'https://picsum.photos/seed/headphones2/600/600',
    ],
    reviews: [
      { user: 'John D.', comment: 'Incredible sound quality and very long battery life. Highly recommended!' },
    ],
  },
  {
    id: 3,
    name: 'Modern Ceramic Vase',
    description:
      'Add a touch of elegance to your home with this beautifully crafted ceramic vase. Its minimalist design complements any decor, making it a perfect centerpiece.',
    price: 45.5,
    rating: 4.2,
    category: 'Home Goods',
    stock: 5,
    images: [
      'https://picsum.photos/seed/vase1/600/600',
    ],
    reviews: [],
  },
  {
    id: 4,
    name: 'Organic Green Tea',
    description:
      'A refreshing and healthy blend of organic green tea leaves. Sourced from the finest gardens, this tea offers a smooth and delicate flavor.',
    price: 15.99,
    rating: 4.9,
    category: 'Groceries',
    stock: 25,
    images: [
        'https://picsum.photos/seed/tea1/600/600',
    ],
    reviews: [
        { user: 'Sarah', comment: 'The best green tea I have ever tasted.' },
        { user: 'Tom', comment: 'Very high quality and great taste.' },
    ]
  },
  {
    id: 5,
    name: 'Men\'s Running Shoes',
    description:
      'Achieve your best performance with these lightweight and comfortable running shoes. Designed for maximum support and durability, they are perfect for your daily run.',
    price: 120.0,
    rating: 4.7,
    category: 'Apparel',
    stock: 8,
    images: [
      'https://picsum.photos/seed/shoes1/600/600',
      'https://picsum.photos/seed/shoes2/600/600',
      'https://picsum.photos/seed/shoes3/600/600',
    ],
    reviews: [
        { user: 'Mike', comment: 'Super comfortable and great for long runs.' },
    ]
  },
  {
    id: 6,
    name: 'Smart Home Hub',
    description:
      'Control all your smart devices from one central hub. Compatible with Alexa, Google Assistant, and Apple HomeKit, it simplifies your smart home experience.',
    price: 89.99,
    rating: 4.4,
    category: 'Electronics',
    stock: 12,
    images: [
      'https://picsum.photos/seed/hub1/600/600',
    ],
    reviews: [
        { user: 'David', comment: 'Makes managing my smart home so much easier.' },
    ]
  },
  {
    id: 7,
    name: 'Gourmet Coffee Beans',
    description:
      'Start your day with the rich and aromatic flavor of these gourmet coffee beans. Sourced from Colombia, they offer a smooth and balanced taste.',
    price: 22.5,
    rating: 4.9,
    category: 'Groceries',
    stock: 0,
    images: [
      'https://picsum.photos/seed/coffee1/600/600',
    ],
    reviews: [
        { user: 'Emily', comment: 'Amazing coffee! Will definitely buy again.' },
    ]
  },
  {
    id: 8,
    name: 'Scented Soy Candle',
    description:
      'Create a relaxing atmosphere with this lavender-scented soy candle. Made from natural soy wax, it provides a clean and long-lasting burn.',
    price: 25.0,
    rating: 4.6,
    category: 'Home Goods',
    stock: 20,
    images: [
      'https://picsum.photos/seed/candle1/600/600',
    ],
    reviews: [
        { user: 'Jessica', comment: 'The scent is so calming and it burns evenly.' },
    ]
  },
  {
    id: 9,
    name: 'Portable Power Bank',
    description:
      'Never run out of battery again with this high-capacity portable power bank. Its compact design makes it easy to carry, and it can charge your phone multiple times.',
    price: 49.99,
    rating: 4.7,
    category: 'Electronics',
    stock: 15,
    images: [
      'https://picsum.photos/seed/powerbank1/600/600',
      'https://picsum.photos/seed/powerbank2/600/600',
    ],
    reviews: [
        { user: 'Chris', comment: 'A lifesaver for traveling. Charges my devices quickly.' },
    ]
  },
  {
    id: 10,
    name: 'Yoga Mat',
    description:
      'Enhance your yoga practice with this non-slip and eco-friendly yoga mat. It provides excellent cushioning and support for all your poses.',
    price: 35.0,
    rating: 4.8,
    category: 'Sports',
    stock: 30,
    images: [
      'https://picsum.photos/seed/yogamat1/600/600',
    ],
    reviews: [
        { user: 'Anna', comment: 'Great grip and very comfortable. Perfect for my daily yoga sessions.' },
    ]
  },
  {
    id: 11,
    name: 'Designer Sunglasses',
    description:
      'Protect your eyes in style with these chic designer sunglasses. Featuring UV400 protection and a modern frame, they are a must-have accessory.',
    price: 180.0,
    rating: 4.9,
    category: 'Accessories',
    stock: 7,
    images: [
      'https://picsum.photos/seed/sunglasses1/600/600',
    ],
    reviews: [
        { user: 'Laura', comment: 'Love these sunglasses! They are so stylish and well-made.' },
    ]
  },
  {
    id: 12,
    name: 'Insulated Water Bottle',
    description:
      'Keep your drinks cold for 24 hours or hot for 12 hours with this stainless steel insulated water bottle. It\'s leak-proof and perfect for on-the-go hydration.',
    price: 30.0,
    rating: 4.9,
    category: 'Sports',
    stock: 18,
    images: [
      'https://picsum.photos/seed/bottle1/600/600',
    ],
    reviews: [
        { user: 'Mark', comment: 'Works like a charm. Keeps my water cold all day long.' },
    ]
  },
];
