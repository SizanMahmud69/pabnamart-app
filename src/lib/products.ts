import type { Product } from '@/types';

export const products: Product[] = [
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
    id: 13,
    name: 'Luxury Foundation',
    description:
      'A lightweight, full-coverage foundation that leaves a natural, radiant finish. Formulated with skin-loving ingredients to improve your complexion over time.',
    price: 55.0,
    rating: 4.8,
    category: 'Cosmetics',
    stock: 15,
    images: [
      'https://picsum.photos/seed/foundation1/600/600',
    ],
    reviews: [
        { user: 'Grace', comment: 'Flawless coverage and feels so light on the skin!' },
    ]
  },
   {
    id: 14,
    name: 'Women\'s Summer Dress',
    description:
      'Stay cool and stylish in this beautiful floral summer dress. Made from breathable cotton, it\'s perfect for warm weather and casual outings.',
    price: 75.0,
    rating: 4.6,
    category: 'Apparel',
    stock: 20,
    images: [
      'https://picsum.photos/seed/dress1/600/600',
      'https://picsum.photos/seed/dress2/600/600'
    ],
    reviews: [
        { user: 'Chloe', comment: 'I love this dress! The fit is perfect and the fabric is so comfortable.' },
    ]
  }
];
