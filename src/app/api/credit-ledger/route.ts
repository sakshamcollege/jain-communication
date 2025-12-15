import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// GET /api/credit-ledger
// Returns parties with computed balance (charges - payments)
export async function GET(_request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const parties = await prisma.party.findMany({
      orderBy: { name: "asc" },
    });

    const grouped = await prisma.creditTransaction.groupBy({
      by: ["partyId", "type"],
      _sum: { amount: true },
    });

    const byPartyId = new Map<
      string,
      { charges: number; payments: number }
    >();

    for (const row of grouped) {
      const current = byPartyId.get(row.partyId) ?? { charges: 0, payments: 0 };
      const sum = row._sum.amount ?? 0;
      if (row.type === "CHARGE") current.charges = sum;
      if (row.type === "PAYMENT") current.payments = sum;
      byPartyId.set(row.partyId, current);
    }

    const result = parties.map((p) => {
      const totals = byPartyId.get(p.id) ?? { charges: 0, payments: 0 };
      const balance = totals.charges - totals.payments;
      return {
        ...p,
        chargesTotal: totals.charges,
        paymentsTotal: totals.payments,
        balance,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching credit ledger:", error);
    return NextResponse.json({ error: "Failed to fetch credit ledger" }, { status: 500 });
  }
}
