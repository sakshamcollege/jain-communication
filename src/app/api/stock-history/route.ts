import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET stock movements with optional date filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const productId = searchParams.get("productId");
    const type = searchParams.get("type"); // STOCK_IN, STOCK_OUT, INITIAL, ADJUSTMENT
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

    if (type) {
      where.type = type;
    }

    const stockMovements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json(stockMovements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}

// GET stock summary (current stock for all products with movements)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "summary") {
      // Get all products with their current stock and recent movements
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          stock: true,
          stockMovements: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(products);
    }

    // Manual stock adjustment
    if (action === "adjust") {
      const { productId, quantity, reason } = body;

      if (!productId || quantity === undefined) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      const previousStock = product.stock;
      const newStock = previousStock + Number(quantity);

      if (newStock < 0) {
        return NextResponse.json(
          { error: "Stock cannot be negative" },
          { status: 400 }
        );
      }

      // Create stock movement and update product stock in a transaction
      const [stockMovement] = await prisma.$transaction([
        prisma.stockMovement.create({
          data: {
            productId,
            type: Number(quantity) > 0 ? "STOCK_IN" : "ADJUSTMENT",
            quantity: Number(quantity),
            previousStock,
            newStock,
            reason: reason || (Number(quantity) > 0 ? "Manual stock addition" : "Manual stock adjustment"),
          },
          include: {
            product: true,
          },
        }),
        prisma.product.update({
          where: { id: productId },
          data: { stock: newStock },
        }),
      ]);

      return NextResponse.json(stockMovement, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in stock operation:", error);
    return NextResponse.json(
      { error: "Stock operation failed" },
      { status: 500 }
    );
  }
}
