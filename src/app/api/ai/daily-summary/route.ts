import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";
import { getStartOfToday } from "@/lib/helpers";
import { askOllama } from "../_lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDayLabel(start: Date, end: Date): string {
  const startLabel = start.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const endLabel = end.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

export async function GET() {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const startOfToday = getStartOfToday();
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [yesterdaySales, salesCount, expenseAgg, lowStockProducts] =
      await Promise.all([
        prisma.sale.findMany({
          where: {
            createdAt: {
              gte: startOfYesterday,
              lt: startOfToday,
            },
          },
          select: {
            quantity: true,
            sellingPrice: true,
          },
        }),
        prisma.sale.count({
          where: {
            createdAt: {
              gte: startOfYesterday,
              lt: startOfToday,
            },
          },
        }),
        prisma.expense.aggregate({
          where: {
            createdAt: {
              gte: startOfYesterday,
              lt: startOfToday,
            },
          },
          _sum: { amount: true },
        }),
        prisma.product.findMany({
          where: {
            stock: {
              lte: 5,
            },
          },
          orderBy: { stock: "asc" },
          take: 6,
          select: {
            name: true,
            stock: true,
          },
        }),
      ]);

    const totalSalesAmount = yesterdaySales.reduce(
      (sum, sale) => sum + sale.sellingPrice * sale.quantity,
      0
    );

    const totalExpenses = expenseAgg._sum.amount || 0;

    const dayLabel = formatDayLabel(startOfYesterday, new Date(startOfToday.getTime() - 1));

    const lowStockLines = lowStockProducts
      .map((p) => `- ${p.name}: ${p.stock} left`)
      .join("\n");

    const prompt = [
      "You are an assistant for a mobile shop owner.",
      "Write a short, practical daily business summary.",
      "Use bullet points.",
      "Include one actionable tip.",
      "Be conservative and do not invent any data.",
      "",
      `Date: ${dayLabel}`,
      `Total sales amount (INR): ${Math.round(totalSalesAmount)}`,
      `Number of sales: ${salesCount}`,
      `Total expenses (INR): ${Math.round(totalExpenses)}`,
      "",
      lowStockProducts.length
        ? "Low stock items:\n" + lowStockLines
        : "Low stock items: none",
    ].join("\n");

    const summary = await askOllama(prompt);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error generating daily AI summary:", error);
    return NextResponse.json(
      { error: "Failed to generate daily summary" },
      { status: 500 }
    );
  }
}
