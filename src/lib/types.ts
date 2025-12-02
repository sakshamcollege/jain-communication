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

// Recharge types
export interface Recharge {
  id: string;
  mobileNumber: string;
  amount: number;
  type: string;
  operator?: string | null;
  profit: number;
  userId?: string | null;
  createdAt: Date;
}

// Stock Movement types
export type StockMovementType = "STOCK_IN" | "STOCK_OUT" | "INITIAL" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  referenceId?: string | null;
  createdAt: Date;
  product?: Product;
}

export interface StockMovementWithProduct extends StockMovement {
  product: Product;
}

// Dashboard types
export interface DashboardStats {
  // Product Sales
  todaySales: number;
  todayProfit: number;
  todaySalesCount: number;
  weeklySales: number;
  weeklyProfit: number;
  weeklySalesCount: number;
  monthlySales: number;
  monthlyProfit: number;
  monthlySalesCount: number;
  
  // Recharges
  todayRecharges: number;
  todayRechargeCommission: number;
  todayRechargeCount: number;
  weeklyRecharges: number;
  weeklyRechargeCommission: number;
  weeklyRechargeCount: number;
  monthlyRecharges: number;
  monthlyRechargeCommission: number;
  monthlyRechargeCount: number;
  
  // Combined totals
  todayTotalProfit: number;
  weeklyTotalProfit: number;
  monthlyTotalProfit: number;
  
  // Inventory
  totalProducts: number;
  lowStockCount: number;
  
  // Recent activity
  recentSales: SaleWithProduct[];
  recentRecharges: Recharge[];
  lowStockProducts: Product[];
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
