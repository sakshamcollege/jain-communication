import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateProductInput } from "@/lib/types";
import { checkAuth } from "@/lib/api-auth";

// GET all products with optional search and filters
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
        { imei: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      where.stock = { lte: 5 };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortBy]: order },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create a new product
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const body: CreateProductInput = await request.json();

    const { name, category, purchasePrice, sellingPrice, stock, imei, supplier, description, specs, frontImage, backImage } = body;

    // Validation
    if (!name || !category || purchasePrice === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const initialStock = Number(stock) || 0;

    // Create product and log initial stock movement in a transaction
    const [product] = await prisma.$transaction([
      prisma.product.create({
        data: {
          name,
          category,
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          stock: initialStock,
          imei: imei || null,
          supplier: supplier || null,
          description: description || null,
          specs: specs || null,
          frontImage: frontImage || null,
          backImage: backImage || null,
        },
      }),
    ]);

    // Create initial stock movement if there's initial stock (non-blocking)
    if (initialStock > 0) {
      try {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: "INITIAL",
            quantity: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: "Initial stock when product was created",
          },
        });
      } catch (stockError) {
        console.error("Failed to log initial stock movement:", stockError);
        // Don't fail the product creation if stock movement logging fails
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
