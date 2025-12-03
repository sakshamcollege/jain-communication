import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RECHARGE_COMMISSION_PERCENT = 3;

// PUT /api/recharges/[id] - Update a recharge record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, description } = body;

    // Check if recharge exists
    const existingRecharge = await prisma.recharge.findUnique({
      where: { id },
    });

    if (!existingRecharge) {
      return NextResponse.json(
        { error: "Recharge not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return NextResponse.json(
          { error: "Valid amount is required" },
          { status: 400 }
        );
      }
      const numericAmount = Number(amount);
      updateData.amount = numericAmount;
      // Recalculate profit when amount changes
      updateData.profit = (numericAmount * RECHARGE_COMMISSION_PERCENT) / 100;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    const recharge = await prisma.recharge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(recharge);
  } catch (error) {
    console.error("Error updating recharge:", error);
    return NextResponse.json(
      { error: "Failed to update recharge" },
      { status: 500 }
    );
  }
}

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
