// ✅ Product Interface
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  inStock: boolean;
  image?: string; // image uploaded by Admin (optional at start)
}

// ✅ Get products from localStorage or fallback to defaults
export const getProducts = (): Product[] => {
  try {
    const storedData = localStorage.getItem("productData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return parsed.products || products;
    }
  } catch (error) {
    console.warn("Error reading products from localStorage:", error);
  }
  return products;
};

// ✅ Get categories from localStorage or fallback to defaults
export const getCategories = (): string[] => {
  try {
    const storedData = localStorage.getItem("productData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      return parsed.categories || categories;
    }
  } catch (error) {
    console.warn("Error reading categories from localStorage:", error);
  }
  return categories;
};

// ✅ Default Products (⚠️ no static images, Admin will upload)
export const products: Product[] = [
  { id: "1", name: "Electric Sparklers (10cm)", price: 1, category: "Sparklers", description: "Safe sparklers for kids", inStock: true },
  { id: "2", name: "Golden Sparklers (15cm)", price: 40, category: "Sparklers", description: "Premium golden sparklers", inStock: true },
  { id: "3", name: "Color Sparklers (12cm)", price: 35, category: "Sparklers", description: "Multi-color sparklers", inStock: true },

  { id: "4", name: "Flower Pot (Small)", price: 15, category: "Ground Spinners", description: "Beautiful ground spinner", inStock: true },
  { id: "5", name: "Flower Pot (Medium)", price: 25, category: "Ground Spinners", description: "Medium sized flower pot", inStock: true },
  { id: "6", name: "Flower Pot (Large)", price: 40, category: "Ground Spinners", description: "Large flower pot with colors", inStock: true },

  { id: "7", name: "Sky Shot (Single)", price: 60, category: "Aerial", description: "Single shot aerial firework", inStock: true },
  { id: "8", name: "Multi-Shot Cake (25 shots)", price: 180, category: "Aerial", description: "25 shots aerial cake", inStock: true },
  { id: "9", name: "Roman Candle", price: 45, category: "Aerial", description: "Classic roman candle", inStock: true },

  { id: "10", name: "Baby Bomb (10 pieces)", price: 30, category: "Sound", description: "Small sound crackers", inStock: true },
  { id: "11", name: "Chocolate Bomb (5 pieces)", price: 35, category: "Sound", description: "Medium sound crackers", inStock: true },
  { id: "12", name: "Thunder Bomb (3 pieces)", price: 50, category: "Sound", description: "Loud sound crackers", inStock: true },

  { id: "13", name: "Pencil Crackers (Pack)", price: 20, category: "Special", description: "Traditional pencil crackers", inStock: true },
  { id: "14", name: "Snake Tablets (10 pieces)", price: 15, category: "Special", description: "Fun snake tablets for kids", inStock: true },
  { id: "15", name: "Chakkar (Spinning Wheel)", price: 25, category: "Special", description: "Colorful spinning wheel", inStock: true },

  { id: "16", name: "Golden Crown (7 shots)", price: 120, category: "Premium", description: "Premium aerial firework", inStock: true },
  { id: "17", name: "Silver Fountain", price: 80, category: "Premium", description: "Beautiful silver fountain", inStock: true },
  { id: "18", name: "Color Changing Fountain", price: 95, category: "Premium", description: "Multi-color fountain", inStock: true },
];

// ✅ Default Categories
export const categories = [
  "All",
  "Sparklers",
  "Ground Spinners", 
  "Aerial",
  "Sound",
  "Special",
  "Premium"
];
