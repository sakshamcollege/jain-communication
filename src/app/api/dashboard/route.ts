import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStartOfToday, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";
import { checkAuth } from "@/lib/api-auth";

// GET dashboard statistics
export async function GET() {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const startOfToday = getStartOfToday();
    const startOfWeek = getStartOfWeek();
    const startOfMonth = getStartOfMonth();

    // Execute all queries in parallel for better performance
    const [
      todaySalesData,
      weeklySalesData,
      monthlySalesData,
      todayRechargeData,
      weeklyRechargeData,
      monthlyRechargeData,
      totalProducts,
      lowStockCount,
      recentSales,
      recentRecharges,
      lowStockProducts,
    ] = await Promise.all([
      // Today's sales and profit
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { sellingPrice: true, profit: true },
        _count: true,
      }),
      // Weekly sales and profit
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { sellingPrice: true, profit: true },
        _count: true,
      }),
      // Monthly sales and profit
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { sellingPrice: true, profit: true },
        _count: true,
      }),
      // Today's recharge and commission
      prisma.recharge.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { amount: true, profit: true },
        _count: true,
      }),
      // Weekly recharge and commission
      prisma.recharge.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { amount: true, profit: true },
        _count: true,
      }),
      // Monthly recharge and commission
      prisma.recharge.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true, profit: true },
        _count: true,
      }),
      // Total products count
      prisma.product.count(),
      // Low stock products count (stock <= 5)
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      // Recent sales (last 5)
      prisma.sale.findMany({
        include: { product: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Recent recharges (last 5)
      prisma.recharge.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Low stock products list
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
      }),
    ]);

    const dashboardStats = {
      // Product Sales
      todaySales: todaySalesData._sum.sellingPrice || 0,
      todayProfit: todaySalesData._sum.profit || 0,
      todaySalesCount: todaySalesData._count,
      weeklySales: weeklySalesData._sum.sellingPrice || 0,
      weeklyProfit: weeklySalesData._sum.profit || 0,
      weeklySalesCount: weeklySalesData._count,
      monthlySales: monthlySalesData._sum.sellingPrice || 0,
      monthlyProfit: monthlySalesData._sum.profit || 0,
      monthlySalesCount: monthlySalesData._count,
      
      // Recharges
      todayRecharges: todayRechargeData._sum.amount || 0,
      todayRechargeCommission: todayRechargeData._sum.profit || 0,
      todayRechargeCount: todayRechargeData._count,
      weeklyRecharges: weeklyRechargeData._sum.amount || 0,
      weeklyRechargeCommission: weeklyRechargeData._sum.profit || 0,
      weeklyRechargeCount: weeklyRechargeData._count,
      monthlyRecharges: monthlyRechargeData._sum.amount || 0,
      monthlyRechargeCommission: monthlyRechargeData._sum.profit || 0,
      monthlyRechargeCount: monthlyRechargeData._count,
      
      // Combined totals
      todayTotalProfit: (todaySalesData._sum.profit || 0) + (todayRechargeData._sum.profit || 0),
      weeklyTotalProfit: (weeklySalesData._sum.profit || 0) + (weeklyRechargeData._sum.profit || 0),
      monthlyTotalProfit: (monthlySalesData._sum.profit || 0) + (monthlyRechargeData._sum.profit || 0),
      
      // Inventory
      totalProducts,
      lowStockCount,
      
      // Recent activity
      recentSales,
      recentRecharges,
      lowStockProducts,
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
