import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PAYMENT_MODES } from "@/lib/types";

// PUT /api/expenses/[id] - Update an expense record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, description } = body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found" },
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
      updateData.amount = Number(amount);
    }

    if (paymentMode !== undefined) {
      if (!PAYMENT_MODES.includes(paymentMode)) {
        return NextResponse.json(
          { error: "Valid payment mode is required" },
          { status: 400 }
        );
      }
      updateData.paymentMode = paymentMode;
    }

    if (description !== undefined) {
      if (description.trim() === "") {
        return NextResponse.json(
          { error: "Description is required" },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete an expense record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
      deletedAmount: expense.amount,
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
