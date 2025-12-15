import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// GET /api/credit-ledger/parties/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const party = await prisma.party.findUnique({
      where: { id },
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: { partyId: id },
      orderBy: { createdAt: "desc" },
    });

    const grouped = await prisma.creditTransaction.groupBy({
      by: ["type"],
      where: { partyId: id },
      _sum: { amount: true },
    });

    const chargesTotal = grouped.find((g) => g.type === "CHARGE")?._sum.amount ?? 0;
    const paymentsTotal = grouped.find((g) => g.type === "PAYMENT")?._sum.amount ?? 0;

    return NextResponse.json({
      party,
      transactions,
      chargesTotal,
      paymentsTotal,
      balance: chargesTotal - paymentsTotal,
    });
  } catch (error) {
    console.error("Error fetching party ledger:", error);
    return NextResponse.json({ error: "Failed to fetch party ledger" }, { status: 500 });
  }
}
