import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UpdateProductInput } from "@/lib/types";
import { checkAuth } from "@/lib/api-auth";

// GET single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body: UpdateProductInput = await request.json();

    const { name, category, purchasePrice, sellingPrice, stock, imei, supplier, description, specs, frontImage, backImage } = body;

    // Get current product to check stock changes
    const currentProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(imei !== undefined && { imei: imei || null }),
        ...(supplier !== undefined && { supplier: supplier || null }),
        ...(description !== undefined && { description: description || null }),
        ...(specs !== undefined && { specs: specs || null }),
        ...(frontImage !== undefined && { frontImage: frontImage || null }),
        ...(backImage !== undefined && { backImage: backImage || null }),
      },
    });

    // Log stock movement if stock changed (non-blocking)
    if (stock !== undefined && Number(stock) !== currentProduct.stock) {
      const previousStock = currentProduct.stock;
      const newStock = Number(stock);
      const quantityChange = newStock - previousStock;

      try {
        await prisma.stockMovement.create({
          data: {
            productId: id,
            type: quantityChange > 0 ? "STOCK_IN" : "ADJUSTMENT",
            quantity: quantityChange,
            previousStock,
            newStock,
            reason: quantityChange > 0 ? "Stock added via product update" : "Stock adjusted via product update",
          },
        });
      } catch (stockError) {
        console.error("Failed to log stock movement:", stockError);
        // Don't fail the product update if stock movement logging fails
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
