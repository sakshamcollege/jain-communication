import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// DELETE /api/parties/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const party = await prisma.party.findUnique({ where: { id } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete ledger transactions first so we don't leave orphaned references (sourceId is not a FK).
      const deletedTransactions = await tx.creditTransaction.deleteMany({
        where: { partyId: id },
      });

      // Delete any recharge/expense records linked to this party so it is "as if it never existed".
      const deletedRecharges = await tx.recharge.deleteMany({
        where: { partyId: id },
      });

      const deletedExpenses = await tx.expense.deleteMany({
        where: { partyId: id },
      });

      await tx.party.delete({ where: { id } });

      return {
        deletedTransactions: deletedTransactions.count,
        deletedRecharges: deletedRecharges.count,
        deletedExpenses: deletedExpenses.count,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Error deleting party:", error);
    return NextResponse.json({ error: "Failed to delete party" }, { status: 500 });
  }
}
