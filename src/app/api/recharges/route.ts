import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

const RECHARGE_COMMISSION_PERCENT = 3;

// GET /api/recharges - List all recharges with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (startDate) {
      where.createdAt = {
        ...(where.createdAt as Record<string, unknown>),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.createdAt = {
        ...(where.createdAt as Record<string, unknown>),
        lte: new Date(endDate),
      };
    }

    const recharges = await prisma.recharge.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recharges);
  } catch (error) {
    console.error("Error fetching recharges:", error);
    return NextResponse.json(
      { error: "Failed to fetch recharges" },
      { status: 500 }
    );
  }
}

// POST /api/recharges - Create a new recharge record
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { amount, description } = body;

    // Validate required fields
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    
    // Calculate profit at 3% commission
    const profit = (numericAmount * RECHARGE_COMMISSION_PERCENT) / 100;

    const userId = auth.session.user.id;

    const recharge = await prisma.recharge.create({
      data: {
        amount: numericAmount,
        profit,
        description: description || null,
        userId,
      },
    });

    return NextResponse.json(recharge, { status: 201 });
  } catch (error) {
    console.error("Error creating recharge:", error);
    return NextResponse.json(
      { error: "Failed to create recharge" },
      { status: 500 }
    );
  }
}
