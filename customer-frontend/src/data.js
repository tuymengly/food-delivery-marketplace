export const menu = [
  { id: 1, name: "Home", link: "/home", key: "nav.home" },
  { id: 2, name: "Menu", link: "/menu", key: "nav.menu" },
  { id: 3, name: "About", link: "/about", key: "nav.about" },
  { id: 4, name: "Contact", link: "/contact", key: "nav.contact" },
  { id: 5, name: "Service", link: "/service", key: "nav.service" },
  { id: 6, name: "Reservation", link: "/reservation", key: "nav.reservation" },
];
// Category data
import Cat_Food from '../src/assets/image/Cate_Foods.jpg'
import Cat_Snack from '../src/assets/image/Cate_Snacks.jpg'
import Cat_Dessert from '../src/assets/image/Cate-Dessert.jpg'
import Cat_Soup from '../src/assets/image/Cate_Soup.jpg'
export const khmerFoodCategories = [
  {
    id: 1,
    name: "ម្ហូបអាហារ​ (Main Dish)",
    description: "Experience authentic Cambodian main dishes packed with bold flavors, fresh ingredients, and traditional cooking techniques passed down through generations.",
    imageUrl: Cat_Food,
    linkUrl: "/MenuFood"
  },
  {
    id: 2,
    name: "អាហារសម្រន់ (Snack)",
    description: "Delightful Khmer snacks perfect for any time of day. From crispy fritters to savory dumplings, each bite tells a story of Cambodia's rich street food culture.",
    imageUrl: Cat_Snack,
    linkUrl: "/MenuSnack"
  },
  {
    id: 3,
    name: "បង្អែម (Dessert)",
    description: "Indulge in traditional Cambodian sweets featuring coconut, palm sugar, and tropical fruits. Each dessert is a perfect balance of flavor and texture.",
    imageUrl: Cat_Dessert,
    linkUrl: "/MenuDessert"
  },
  {
    id: 4,
    name: "ស៊ុប (Soup)",
    description: "Warm your soul with authentic Khmer soups. From tangy and sour to rich and savory, our soups are crafted with fresh herbs, vegetables, and aromatic spices.",
    imageUrl: Cat_Soup,
    linkUrl: "/MenuSoup"
  }
];


// Menu Food Data
import cate_food1 from '../src/assets/image/cate_food1.jpg'
import cate_food2 from '../src/assets/image/cate_food2.jpg'
import cate_food3 from '../src/assets/image/cate_food3.jpg'
import cate_food4 from '../src/assets/image/cate_food4.jpg'
import cate_food5 from '../src/assets/image/cate_food5.jpg'
import cate_food6 from '../src/assets/image/cate_food6.jpg'
import cate_food7 from '../src/assets/image/cate_food7.jpg'
import cate_food8 from '../src/assets/image/cate_food8.jpg'
export const khmerFoods = [
  {
    id: 1,
    name: "Amok Trey (អាម៉ុកត្រី)",
    description: "Traditional Khmer fish curry steamed in banana leaves with coconut cream and kroeung spices. A signature Cambodian dish featuring fresh river fish in a creamy, aromatic custard infused with lemongrass, galangal, and kaffir lime leaves. Each bite delivers the perfect harmony of flavors.",
    price: 2.00,
    qty: 30,
    image: cate_food1,
    category: "Main Dish",
    rating: 4.9,
    prepTime: "25-30 min",
    spicyLevel: "Mild"
  },
  {
    id: 2,
    name: "Nom Banh Chok (នំបញ្ចុក)",
    description: "Fresh rice noodles served with fish-based green curry gravy and an abundance of fresh vegetables. Often called 'Khmer noodles,' this breakfast favorite features handmade rice noodles topped with aromatic green fish curry made from lemongrass, turmeric, and kaffir lime. Garnished with cucumber, bean sprouts, banana blossom, and fresh herbs.",
    price: 2.75,
    qty: 45,
    image: cate_food2,
    category: "Main Dish",
    rating: 4.8,
    prepTime: "20-25 min",
    spicyLevel: "Medium"
  },
  {
    id: 3,
    name: "Bai Sach Chrouk (បាយសាច់ជ្រូក)",
    description: "Grilled marinated pork over broken rice with pickled vegetables and cucumber. A beloved Cambodian breakfast dish featuring tender pork marinated in coconut milk, garlic, and soy sauce, grilled to perfection over charcoal. Served on fluffy broken rice with pickled vegetables, fresh cucumber slices, and a side of chicken broth soup.",
    price: 2.50,
    qty: 40,
    image: cate_food3,
    category: "Main Dish",
    rating: 4.7,
    prepTime: "15-20 min",
    spicyLevel: "None"
  },
  {
    id: 4,
    name: "Lok Lak (លុកឡាក់)",
    description: "Stir-fried beef with Kampot pepper served on lettuce with tomato and lime-pepper sauce. Premium cubes of tender beef marinated in oyster sauce and famous Kampot black pepper, stir-fried to perfection. Served on a bed of fresh lettuce with tomatoes, onions, and a zesty lime-pepper dipping sauce. A true taste of Cambodia's culinary excellence.",
    price: 3.50,
    qty: 25,
    image: cate_food4,
    category: "Main Dish",
    rating: 4.9,
    prepTime: "20-25 min",
    spicyLevel: "Mild"
  },
  {
    id: 5,
    name: "Bai Cha (បាយឆា)",
    description: "Cambodian fried rice with choice of protein, mixed vegetables, and aromatic seasonings. This flavorful dish features jasmine rice stir-fried with fresh vegetables, egg, garlic, and soy sauce. Choose from chicken, beef, pork, or seafood. Garnished with cucumber, lime, and fresh herbs for an authentic taste.",
    price: 2.75,
    qty: 60,
    image: cate_food5,
    category: "Main Dish",
    rating: 4.6,
    prepTime: "15-18 min",
    spicyLevel: "Mild"
  },
  {
    id: 6,
    name: "Sach Ko Ang (សាច់គោអាំង)",
    description: "Grilled beef marinated in Khmer spices, served with tangy dipping sauce. Succulent beef slices marinated in a blend of lemongrass, galangal, turmeric, and garlic, then grilled over charcoal for a smoky flavor. Accompanied by a prahok-based dipping sauce and fresh vegetables. A perfect harmony of smoky, sweet, and savory.",
    price: 4.25,
    qty: 35,
    image: cate_food6,
    category: "Main Dish",
    rating: 4.8,
    prepTime: "25-30 min",
    spicyLevel: "Medium"
  },
  {
    id: 7,
    name: "Mi Cha (មីឆា)",
    description: "Stir-fried egg noodles with vegetables and your choice of protein. Yellow wheat noodles wok-tossed with crisp vegetables, garlic, soy sauce, and oyster sauce. Choose from chicken, beef, pork, or mixed seafood. This popular street food dish is savory, satisfying, and packed with umami flavors.",
    price: 2.80,
    qty: 50,
    image: cate_food7,
    category: "Main Dish",
    rating: 4.7,
    prepTime: "15-20 min",
    spicyLevel: "Mild"
  },
  {
    id: 8,
    name: "Kuy Teav (គុយទាវ)",
    description: "Rice noodle soup with pork, shrimp, and bean sprouts in a flavorful broth. Cambodia's most popular breakfast soup featuring delicate rice noodles in a clear, aromatic pork bone broth slow-cooked for hours. Topped with sliced pork, shrimp, quail eggs, fried garlic, scallions, and bean sprouts. Customize with lime, chili, and fresh herbs.",
    price: 2.25,
    qty: 40,
    image: cate_food8,
    category: "Main Dish",
    rating: 4.9,
    prepTime: "18-22 min",
    spicyLevel: "None"
  },
  {
    id: 1,
    name: "អាម៉ុកត្រី (Fish Amok)",
    price: 3.5,
    category: "Main Dish",
    image: cate_food1, // ឬ Path រូបភាពរបស់អ្នក
    rating: 4.8,
    isRecommended: true,
    discountCode: "FIRST50"  // 👈 បន្ថែមត្រង់នេះសម្រាប់ 50% Deal
  },
  {
    id: 2,
    name: "បាយសាច់ជ្រូក (Pork Rice)",
    price: 2.0,
    category: "Main Dish",
    image: cate_food2,
    rating: 4.5,
    isRecommended: true,
    discountCode: "WEEKEND20" // 👈 បន្ថែមត្រង់នេះសម្រាប់ 20% Deal
  },
];

// Menu Snack Data
import cate_snack1 from '../src/assets/image/cate_snack1.jpg'
import cate_snack2 from '../src/assets/image/cate_snack2.jpg'
import cate_snack3 from '../src/assets/image/cate_snack3.jpeg'
import cate_snack4 from '../src/assets/image/cate_snack4.jpg'
import cate_snack5 from '../src/assets/image/cate_snack5.jpg'
import cate_snack6 from '../src/assets/image/cate_snack6.jpg'
import cate_snack7 from '../src/assets/image/cate_snack7.jpg'
import cate_snack8 from '../src/assets/image/cate_snack8.jpg'
export const khmerSnacks = [
    {
      id: 1,
      name: "Num Akor (នំអាកោ)",
      description: "Soft steamed rice cake made from fermented rice flour and coconut milk, with a sweet and slightly tangy flavor. These fluffy, cloud-like cakes have a unique texture and subtle sweetness. Perfect as a breakfast snack or afternoon treat with tea or coffee.",
      price: 0.75,
      qty: 90,
      image: cate_snack1,
      category: "Khmer Snacks",
      rating: 4.6,
      prepTime: "5-8 min"
    },
    {
        id: 2,
        name: "Chek Chien (ចេកអាំង)",
        description: "Fried banana fritters coated in crispy rice flour batter — sweet, crunchy, and irresistible. Made with ripe local bananas dipped in a light, crispy batter and deep-fried until golden. The perfect combination of caramelized banana sweetness and crispy texture.",
        price: 0.75,
        qty: 100,
        image: cate_snack2,
        category: "Khmer Snacks",
        rating: 4.8,
        prepTime: "5-7 min"
    },
    {
        id: 3,
        name: "Num Ansom Chek (អន្សមចេក)",
        description: "Banana sticky rice wrapped in banana leaf, a popular festival treat. Glutinous rice mixed with ripe banana and coconut, wrapped in banana leaves and steamed until tender. Sweet, fragrant, and naturally delicious.",
        price: 1.00,
        qty: 60,
        image: cate_snack3,
        category: "Khmer Snacks",
        rating: 4.5,
        prepTime: "Ready to serve"
    },
    {
        id: 4,
        name: "Nom Krok (នំក្រុក)",
        description: "Coconut rice pancakes cooked in a special pan, crispy outside and soft inside. These bite-sized delights are made from rice flour and coconut milk. Crispy golden edges with a soft, creamy center. Often topped with spring onions or sweet corn for extra flavor.",
        price: 0.50,
        qty: 120,
        image: cate_snack4,
        category: "Khmer Snacks",
        rating: 4.9,
        prepTime: "8-10 min"
    },
    {
        id: 5,
        name: "Num Pang Sach Ko (នំបុ័ងសាច់គោ)",
        description: "Cambodian beef baguette sandwich with pickled vegetables and herbs.",
        price: 1.50,
        qty: 50,
        image: cate_snack5,
        category: "Khmer Snacks"
    },
    {
        id: 6,
        name: "Kror Lan (ក្រឡាន)",
        description: "Traditional Khmer honeycomb cake made from rice flour, coconut milk, and palm sugar.",
        price: 0.80,
        qty: 90,
        image: cate_snack6,
        category: "Khmer Snacks"
    },
    {
        id: 7,
        name: "Num Kong (នំកង)",
        description: "Traditional Khmer donut made from glutinous rice flour.",
        price: 0.80,
        qty: 90,
        image: cate_snack7,
        category: "Khmer Snacks"
    },
    {
        id: 8,
        name: "Num Kachay (នំកញ្ចាយ)",
        description: "Fried chive dumplings with crispy exterior and savory filling.",
        price: 0.75,
        qty: 80,
        image: cate_snack8,
        category: "Khmer Snacks"
    }
];


// Menu Dessert Data
import cate_dessert1 from './assets/image/cate_dessert1.jpg'
import cate_dessert2 from './assets/image/cate_dessert2.jpg'
import cate_dessert3 from './assets/image/cate_dessert3.jpg'
import cate_dessert4 from './assets/image/cate_dessert4.jpg'
import cate_dessert5 from './assets/image/cate_dessert5.jpg'
import cate_dessert6 from './assets/image/cate_dessert6.jpg'
import cate_dessert7 from './assets/image/cate_dessert7.jpg'
import cate_dessert8 from './assets/image/cate_dessert8.jpg'
export const khmerDessert = [
  {
    id: 1,
    name: "Sankhya Lapov (សង្ក្យាល្ពៅ)",
    description: "Steamed pumpkin custard made with eggs, coconut milk, and palm sugar. Soft, fragrant, and creamy — a classic Khmer dessert.",
    price: 1.25,
    qty: 60,
    image: cate_dessert1,
    category: "Khmer Desserts"
  },
  {
    id: 2,
    name: "Cha Houy Teuk (ឆាហ៊ុយទឹក)",
    description: "Colorful jelly dessert served with coconut milk, palm sugar syrup, and crushed ice. A refreshing sweet for hot days.",
    price: 1.00,
    qty: 80,
    image: cate_dessert2,
    category: "Khmer Desserts"
  },
  {
    id: 3,
    name: "Bai Domnerb​ Dong (បាយដំណើបដូង)",
    description: "Sticky rice cooked with ripe coconut, coconut milk, and sesame seeds. Served warm or cold.",
    price: 1.10,
    qty: 70,
    image: cate_dessert3,
    category: "Khmer Desserts"
  },
  {
      id: 4,
      name: "Banh Cha Neuk (បាញ់ឆាណឹក)",
      description: "Skewers marinated with traditional Khmer sweet, served sweet and flavorful.",
      price: 0.75,
      qty: 90,
      image: cate_dessert4, // you can change the image if you have a specific one for Banh Cha Neuk
      category: "Khmer Desserts" // you might want to change this to "Khmer Snacks" or "Khmer Street Food" if more appropriate
  },
  {
    id: 5,
    name: "Jek Ktis (ចេកខ្ទិះ)",
    description: "Steamed Banana  flour cake layered with palm sugar syrup — sweet, sticky, and aromatic.",
    price: 0.70,
    qty: 100,
    image: cate_dessert5,
    category: "Khmer Desserts"
  },
  {
    id: 6,
    name: "Borbor jadov(បបរចាដូវ)",
    description: "Sweet mung bean porridge cooked in coconut milk, often topped with sesame seeds or fried shallots for aroma.",
    price: 0.90,
    qty: 85,
    image: cate_dessert6,
    category: "Khmer Desserts"
},
  {
    id: 7,
    name: "Borbor lot(បបរលត)",
    description: "Steamed rice flour cake made with grated coconut and palm sugar. Soft, chewy, and lightly sweet.",
    price: 0.60,
    qty: 95,
    image: cate_dessert7,
    category: "Khmer Desserts"
},
  {
  id: 8,
  name: "Bor Bor SonDek (បបរសណ្ដែក)",
  description: "Sweet mung bean porridge cooked with coconut milk and palm sugar.",
  price: 0.90,
  qty: 100,
  image: cate_dessert8,
  category: "Khmer Desserts"
}
];



// Menu Soup Data
import cate_soup1 from '../src/assets/image/cate_soup1.jpg'
import cate_soup2 from '../src/assets/image/cate_soup2.jpg'
import cate_soup3 from '../src/assets/image/cate_soup3.jpg'
import cate_soup4 from '../src/assets/image/cate_soup4.jpg'
import cate_soup5 from '../src/assets/image/cate_soup5.jpg'
import cate_soup6 from '../src/assets/image/cate_soup6.jpg'
import cate_soup7 from '../src/assets/image/cate_soup7.jpg'
import cate_soup8 from '../src/assets/image/cate_soup8.jpg'
export const MenuSoup = [
  {
    id: 1,
    name: "Samlor Machu Prorlit (សម្លរម្ជូរ​ព្រលិត)",
    description: "A sour and fragrant soup made with lemongrass, tamarind, and fresh herbs. Often includes fishfor flavor.",
    price: 1.50,
    qty: 50,
    image: cate_soup1,
    category: "Khmer Soups"
  },
  {
    id: 2,
    name: "Samlor Korkoo (សម្លរកកូរ)",
    description: "Traditional Khmer vegetable soup with pork, eggplant, and fermented fish paste. Rich, earthy, and hearty.",
    price: 1.75,
    qty: 60,
    image: cate_soup2,
    category: "Khmer Soups"
  },
  {
    id: 3,
    name: "Samlor Machu yun (សម្លរម្ជូរយួន)",
    description: "A tangy and sweet soup made with green mango, tomatoes, and a light fish broth. Perfect for a refreshing meal.",
    price: 1.60,
    qty: 55,
    image: cate_soup3,
    category: "Khmer Soups"
  },
  {
    id: 4,
    name: "Samlor Khor Trey (សម្លរខត្រី)",
    description: "Fish soup cooked with tamarind, lemongrass, and chili for a slightly spicy, sour, and aromatic flavor.",
    price: 2.00,
    qty: 45,
    image: cate_soup4,
    category: "Khmer Soups"
  },
  {
    id: 5,
    name: "Samlor Mroheu (សម្លរម្រះ)",
    description: "A clear chicken soup infused with ginger, garlic, and fresh herbs. Light yet flavorful, ideal for all ages.",
    price: 1.80,
    qty: 50,
    image: cate_soup5,
    category: "Khmer Soups"
  },
  {
    id: 6,
    name: "Samlor Brawhar (សម្លរប្រហើរ)",
    description: "Beef and vegetable soup with traditional Khmer spices and herbs, cooked slowly for a rich, savory taste.",
    price: 2.20,
    qty: 40,
    image: cate_soup6,
    category: "Khmer Soups"
  },
  {
    id: 7,
    name: "Samlor Machu Kroeung (សម្លរម្ជូរគ្រឿង)",
    description: "A flavorful Khmer soup with a sour base made from tamarind and aromatic kroeung paste, usually with fish or chicken.",
    price: 1.90,
    qty: 45,
    image: cate_soup7,
    category: "Khmer Soups"
  },
  {
    id: 8,
    name: "Samlor Jing Chhay (សម្លរជីងឆាយ)",
    description: "Spicy and fragrant chicken soup cooked with lemongrass, kaffir lime leaves, and turmeric. Rich in flavor and aroma.",
    price: 2.10,
    qty: 50,
    image: cate_soup8,
    category: "Khmer Soups"
  }
];

// data food for discount

export const foodProducts = [
  {
    id: 1,
    name: 'Classic Smash Burger',
    shop: 'The Burger Lab',
    price: 14.99,
    rating: 4.8,
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    discountCode: 'FIRST50', // បញ្ចុះ 50%
    discountPercentage: 50,
    isRecommended: true,
  },
  {
    id: 2,
    name: 'Dragon Roll',
    shop: 'Sushi Hana',
    price: 18.99,
    rating: 4.9,
    img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500',
    discountCode: 'WEEKEND20', // បញ្ចុះ 20%
    discountPercentage: 20,
    isRecommended: true,
  },
  {
    id: 3,
    name: 'Margherita Classica',
    shop: 'Pizza Roma',
    price: 16.99,
    rating: 4.7,
    img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
    discountCode: 'FIRST50',
    discountPercentage: 50,
    isRecommended: false,
  },
  {
    id: 4,
    name: 'Butter Chicken',
    shop: 'Spice Garden',
    price: 17.99,
    rating: 4.8,
    img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500',
    discountCode: 'WEEKEND20',
    discountPercentage: 20,
    isRecommended: true,
  },
  {
    id: 5,
    name: 'Sunshine Buddha Bowl',
    shop: 'Green Bowl',
    price: 16.99,
    rating: 4.6,
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    discountCode: null,
    discountPercentage: 0,
    isRecommended: true,
  },
];
