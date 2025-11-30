import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateSaleInput } from "@/lib/types";

// GET all sales with optional date filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const productId = searchParams.get("productId");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (productId) {
      where.productId = productId;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST create a new sale
export async function POST(request: NextRequest) {
  try {
    const body: CreateSaleInput = await request.json();

    const { productId, quantity, sellingPrice } = body;

    // Validation
    if (!productId || !quantity || sellingPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the product to calculate profit and check stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // Calculate profit
    const profit = (Number(sellingPrice) - product.purchasePrice) * Number(quantity);

    // Create sale and update stock in a transaction
    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          productId,
          quantity: Number(quantity),
          sellingPrice: Number(sellingPrice),
          purchasePrice: product.purchasePrice,
          profit,
        },
        include: {
          product: true,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: Number(quantity) },
        },
      }),
    ]);

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
