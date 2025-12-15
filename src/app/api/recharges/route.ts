import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

const RECHARGE_COMMISSION_PERCENT = 3;

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

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
    const { amount, description, isCredit, partyName, partyPhone } = body as {
      amount?: number;
      description?: string;
      isCredit?: boolean;
      partyName?: string;
      partyPhone?: string;
    };

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

    const shouldCreateCredit = Boolean(isCredit);

    if (shouldCreateCredit) {
      if (!partyName || partyName.trim().length < 2) {
        return NextResponse.json(
          { error: "Customer name is required for credit recharges" },
          { status: 400 }
        );
      }

      const normalizedName = normalizeName(partyName);

      const recharge = await prisma.$transaction(async (tx) => {
        const party = await tx.party.upsert({
          where: {
            type_normalizedName: {
              type: "CUSTOMER",
              normalizedName,
            },
          },
          update: {
            name: partyName.trim(),
            phone: partyPhone?.trim() || null,
          },
          create: {
            type: "CUSTOMER",
            name: partyName.trim(),
            normalizedName,
            phone: partyPhone?.trim() || null,
          },
        });

        const created = await tx.recharge.create({
          data: {
            amount: numericAmount,
            profit,
            description: description || null,
            userId,
            isCredit: true,
            partyId: party.id,
          },
        });

        await tx.creditTransaction.create({
          data: {
            partyId: party.id,
            type: "CHARGE",
            source: "RECHARGE",
            sourceId: created.id,
            amount: numericAmount,
            note: description || null,
          },
        });

        return created;
      });

      return NextResponse.json(recharge, { status: 201 });
    }

    const recharge = await prisma.recharge.create({
      data: {
        amount: numericAmount,
        profit,
        description: description || null,
        userId,
        isCredit: false,
        partyId: null,
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
