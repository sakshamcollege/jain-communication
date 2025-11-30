import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RECHARGE_COMMISSION_PERCENT = 3.5;

// GET /api/recharges - List all recharges with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (type && type !== "all") {
      where.type = type;
    }

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

    if (search) {
      where.mobileNumber = {
        contains: search,
        mode: "insensitive",
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

// POST /api/recharges - Create a new recharge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, amount, type, operator } = body;

    // Validate required fields
    if (!mobileNumber || !amount || !type) {
      return NextResponse.json(
        { error: "Mobile number, amount, and type are required" },
        { status: 400 }
      );
    }

    // Calculate profit at 3.5% commission
    const profit = (amount * RECHARGE_COMMISSION_PERCENT) / 100;

    const recharge = await prisma.recharge.create({
      data: {
        mobileNumber,
        amount: parseFloat(amount),
        type,
        operator: operator || null,
        profit,
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
