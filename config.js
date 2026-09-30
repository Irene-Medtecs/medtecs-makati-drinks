// Medtecs Makati AI Workshop Drink Break — Configuration
window.MEDTECS_CONFIG = {
  // Default Google Apps Script Web App URL (can be customized via Organizer Settings or localStorage)
  gasUrl: localStorage.getItem('medtecs_gas_url') || '',
  
  // Google Spreadsheet details
  spreadsheetId: '1l42PZv0x3kDcH4AO0hyjcY974C1yuyLA32xLjL3DP0g',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1l42PZv0x3kDcH4AO0hyjcY974C1yuyLA32xLjL3DP0g/edit?usp=sharing',
  
  // Event defaults
  eventName: 'Medtecs Makati AI Workshop',
  currency: '₱',
  currencyCode: 'PHP',
  organizer: 'Irene',
  orderCutoff: '2:30 PM',
  currentBatch: 'Workshop Drinks',
  
  // Authoritative topping prices
  toppings: [
    { id: 'Pearl', name: 'Pearl', price: 20 },
    { id: 'Sago', name: 'Sago', price: 20 },
    { id: 'Pudding', name: 'Pudding', price: 25 },
    { id: 'Grass Jelly', name: 'Grass Jelly', price: 25 },
    { id: 'Coconut Jelly', name: 'Coconut Jelly', price: 20 }
  ],
  
  // Standard Starter Menu (offline/fallback cache if Apps Script is connecting)
  starterDrinks: [
    {
      id: 'coco-3buddies',
      name: 'CoCo 3 Buddies Milk Tea',
      category: 'Iconic Must-Tries',
      priceRegular: 120,
      priceLarge: 135,
      description: 'The ultimate comfort drink: creamy signature milk tea overflowing with silky pudding, herbal grass jelly, and chewy pearls.',
      image: 'https://images.unsplash.com/photo-1558857563-b37cfb810903?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-panda',
      name: 'Panda Milk Tea',
      category: 'Iconic Must-Tries',
      priceRegular: 110,
      priceLarge: 125,
      description: 'Rich Taiwanese milk tea paired with contrasting dual toppings: classic black tapioca pearls and crunchy white agar pearls.',
      image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-taro-sago',
      name: 'Taro Milk Tea with Sago',
      category: 'Iconic Must-Tries',
      priceRegular: 125,
      priceLarge: 140,
      description: 'Velvety purple taro milk paired with bouncy micro-sago pearls. Velvety, aromatic, and deeply satisfying.',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-passion-burst',
      name: 'Passion Fruit Tea Burst',
      category: 'Fresh & Fruit Tea',
      priceRegular: 115,
      priceLarge: 130,
      description: 'Crisp green tea infused with real passion fruit pulp & seeds, loaded with chewy pearls and nata de coco.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-lemon-dunk',
      name: 'Lemon Dunk Green Tea',
      category: 'Fresh & Fruit Tea',
      priceRegular: 110,
      priceLarge: 125,
      description: 'An entire fresh lemon immersed and gently pressed into chilled fragrant jasmine green tea.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-brown-sugar-milktea',
      name: 'Brown Sugar Pearl Milk Tea',
      category: 'Brown Sugar Crave',
      priceRegular: 125,
      priceLarge: 140,
      description: 'Bold black milk tea infused with warm caramelized brown sugar and soft boba.',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-matcha-tea',
      name: 'Matcha Milk Tea',
      category: 'Milk Tea Series',
      priceRegular: 120,
      priceLarge: 135,
      description: 'Earthy Japanese Uji matcha infused with smooth fresh milk and creamy richness.',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    },
    {
      id: 'coco-mango-yakult',
      name: 'Mango Yakult',
      category: 'Fresh & Fruit Tea',
      priceRegular: 125,
      priceLarge: 140,
      description: 'Tropical sweet mango puree combined with probiotic Yakult over crushed ice.',
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80',
      available: true,
      sugarOptions: ['100% Regular', '70% Less Sugar', '50% Half Sugar', '30% Slight Sugar', '0% No Sugar'],
      iceOptions: ['Regular Ice', 'Less Ice', 'No Ice'],
      toppings: ['Pearl', 'Sago', 'Pudding', 'Grass Jelly', 'Coconut Jelly']
    }
  ]
};
