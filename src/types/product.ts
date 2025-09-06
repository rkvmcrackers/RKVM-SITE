export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  inStock: boolean;
  image?: string; // image uploaded by Admin (optional)
}
