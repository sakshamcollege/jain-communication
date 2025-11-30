// Product types
export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  imei?: string | null;
  supplier?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  imei?: string;
  supplier?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

// Sale types
export interface Sale {
  id: string;
  productId: string;
  userId?: string | null;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number;
  profit: number;
  createdAt: Date;
  product?: Product;
}

export interface CreateSaleInput {
  productId: string;
  quantity: number;
  sellingPrice: number;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  createdAt: Date;
}

// Dashboard types
export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalProducts: number;
  lowStockCount: number;
  weeklySales: number;
  weeklyProfit: number;
  monthlySales: number;
  monthlyProfit: number;
}

export interface SaleWithProduct extends Sale {
  product: Product;
}

// Report types
export interface SalesReport {
  totalSales: number;
  totalProfit: number;
  totalQuantity: number;
  salesCount: number;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
}

// Category options for products
export const PRODUCT_CATEGORIES = [
  "Mobile Phone",
  "Smartphone",
  "Feature Phone",
  "Tablet",
  "Charger",
  "Earphone",
  "Headphone",
  "Power Bank",
  "Mobile Cover",
  "Screen Protector",
  "Cable",
  "Memory Card",
  "Smartwatch",
  "Speaker",
  "Other Accessory",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
