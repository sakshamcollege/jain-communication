import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// POST /api/credit-ledger/parties/[id]/payments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { amount, note } = body as { amount?: number; note?: string };

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({ where: { id } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const payment = await prisma.creditTransaction.create({
      data: {
        partyId: id,
        type: "PAYMENT",
        source: "MANUAL",
        sourceId: null,
        amount: Number(amount),
        note: note?.trim() || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
