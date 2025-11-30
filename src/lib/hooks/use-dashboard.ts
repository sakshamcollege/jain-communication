import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
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
  recentSales: Array<{
    id: string;
    productId: string;
    quantity: number;
    sellingPrice: number;
    profit: number;
    createdAt: string;
    product: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  recentRecharges: Array<{
    id: string;
    mobileNumber: string;
    amount: number;
    type: string;
    operator?: string | null;
    profit: number;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    category: string;
    stock: number;
  }>;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

