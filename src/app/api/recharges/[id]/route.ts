import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE /api/recharges/[id] - Delete a recharge record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if recharge exists
    const recharge = await prisma.recharge.findUnique({
      where: { id },
    });

    if (!recharge) {
      return NextResponse.json(
        { error: "Recharge not found" },
        { status: 404 }
      );
    }

    // Delete the recharge
    await prisma.recharge.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Recharge deleted successfully",
      deletedAmount: recharge.amount,
      deletedProfit: recharge.profit,
    });
  } catch (error) {
    console.error("Error deleting recharge:", error);
    return NextResponse.json(
      { error: "Failed to delete recharge" },
      { status: 500 }
    );
  }
}
