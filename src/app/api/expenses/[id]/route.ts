import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PAYMENT_MODES, PaymentMode } from "@/lib/types";
import { checkAuth } from "@/lib/api-auth";

const isValidPaymentMode = (value: string): value is PaymentMode =>
  PAYMENT_MODES.includes(value as PaymentMode);

// PUT /api/expenses/[id] - Update an expense record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMode, description } = body as {
      amount?: number;
      paymentMode?: string;
      description?: string;
      isCredit?: boolean;
      partyName?: string;
    };

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

    if (body?.isCredit !== undefined || body?.partyName !== undefined) {
      return NextResponse.json(
        { error: "Credit status/vendor cannot be changed after creation" },
        { status: 400 }
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
      if (existingExpense.isCredit) {
        return NextResponse.json(
          { error: "Payment mode cannot be changed for credit expenses" },
          { status: 400 }
        );
      }

      if (!isValidPaymentMode(paymentMode)) {
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

    if ((amount !== undefined || description !== undefined) && existingExpense.isCredit) {
      await prisma.creditTransaction.updateMany({
        where: {
          source: "EXPENSE",
          sourceId: id,
          type: "CHARGE",
        },
        data: {
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(description !== undefined ? { note: description?.trim() || null } : {}),
        },
      });
    }

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
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

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

    await prisma.$transaction(async (tx) => {
      if (expense.isCredit) {
        await tx.creditTransaction.deleteMany({
          where: {
            source: "EXPENSE",
            sourceId: id,
            type: "CHARGE",
          },
        });
      }

      // Delete the expense
      await tx.expense.delete({
        where: { id },
      });
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
