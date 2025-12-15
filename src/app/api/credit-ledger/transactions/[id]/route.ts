import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// PATCH /api/credit-ledger/transactions/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { amount, note } = body as { amount?: number; note?: string | null };

    const existing = await prisma.creditTransaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.source !== "MANUAL") {
      return NextResponse.json(
        { error: "Only manual transactions can be edited" },
        { status: 400 }
      );
    }

    if (amount !== undefined && (!Number(amount) || Number(amount) <= 0)) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const updated = await prisma.creditTransaction.update({
      where: { id },
      data: {
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(note !== undefined ? { note: note?.toString().trim() || null } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating credit transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/credit-ledger/transactions/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const existing = await prisma.creditTransaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.source !== "MANUAL") {
      return NextResponse.json(
        { error: "Only manual transactions can be deleted" },
        { status: 400 }
      );
    }

    await prisma.creditTransaction.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting credit transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
