import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PAYMENT_MODES, PaymentMode } from "@/lib/types";
import { checkAuth } from "@/lib/api-auth";
import type { Prisma } from "@prisma/client";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// GET /api/expenses - List all expenses with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMode = searchParams.get("paymentMode");
    const isPersonal = searchParams.get("isPersonal");

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

    const isValidPaymentMode = (value: string): value is PaymentMode =>
      PAYMENT_MODES.includes(value as PaymentMode);

    if (paymentMode && isValidPaymentMode(paymentMode)) {
      where.paymentMode = paymentMode;
    }

    if (isPersonal === "true") {
      where.isPersonal = true;
    } else if (isPersonal === "false") {
      where.isPersonal = false;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense record
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { amount, paymentMode, description, isCredit, isPersonal, partyId, partyName, partyPhone } = body as {
      amount?: number;
      paymentMode?: string;
      description?: string;
      isCredit?: boolean;
      isPersonal?: boolean;
      partyId?: string;
      partyName?: string;
      partyPhone?: string;
    };
    const recordAsPersonal = Boolean(isPersonal);

    // Validate required fields
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const shouldCreateCredit = Boolean(isCredit) && !recordAsPersonal;
    const finalPaymentMode = shouldCreateCredit ? "Credit" : paymentMode;

    if (recordAsPersonal && Boolean(isCredit)) {
      return NextResponse.json(
        { error: "Personal expenses cannot be recorded on vendor credit" },
        { status: 400 }
      );
    }

    if (!finalPaymentMode || !PAYMENT_MODES.includes(finalPaymentMode as PaymentMode)) {
      return NextResponse.json(
        { error: "Valid payment mode is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim() === "") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (shouldCreateCredit) {
      const expense = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const txAny = tx as unknown as {
          party: any;
          expense: any;
          creditTransaction: any;
        };

        let party:
          | { id: string; type: "CUSTOMER" | "VENDOR" }
          | null = null;

        if (partyId) {
          party = await txAny.party.findUnique({ where: { id: partyId } });
          if (!party || party.type !== "VENDOR") {
            throw new Error("Invalid vendor partyId");
          }
        } else {
          if (!partyName || partyName.trim().length < 2) {
            throw new Error("Vendor name is required for credit expenses");
          }

          const normalizedName = normalizeName(partyName);
          party = await txAny.party.upsert({
            where: {
              type_normalizedName: {
                type: "VENDOR",
                normalizedName,
              },
            },
            update: {
              name: partyName.trim(),
              phone: partyPhone?.trim() || null,
            },
            create: {
              type: "VENDOR",
              name: partyName.trim(),
              normalizedName,
              phone: partyPhone?.trim() || null,
            },
          });
        }

        if (!party) {
          throw new Error("Failed to resolve vendor party");
        }

        const created = await txAny.expense.create({
          data: {
            amount: Number(amount),
            paymentMode: "Credit",
            description: description.trim(),
            isCredit: true,
            isPersonal: false,
            partyId: party.id,
          } as any,
        });

        await txAny.creditTransaction.create({
          data: {
            partyId: party.id,
            type: "CHARGE",
            source: "EXPENSE",
            sourceId: created.id,
            amount: Number(amount),
            note: description.trim(),
          } as any,
        });

        return created;
      });

      return NextResponse.json(expense, { status: 201 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        paymentMode: finalPaymentMode,
        description: description.trim(),
        isCredit: false,
        isPersonal: recordAsPersonal,
        partyId: null,
      } as any,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
