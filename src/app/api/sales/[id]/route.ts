import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// UPDATE a sale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, sellingPrice } = body;

    // Find the existing sale
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    const newQuantity = quantity ?? existingSale.quantity;
    const newSellingPrice = sellingPrice ?? existingSale.sellingPrice;
    const quantityDiff = newQuantity - existingSale.quantity;

    // Check if there's enough stock for increased quantity
    if (quantityDiff > 0 && quantityDiff > existingSale.product.stock) {
      return NextResponse.json(
        { error: "Insufficient stock for this quantity" },
        { status: 400 }
      );
    }

    // Calculate new profit
    const newProfit = (newSellingPrice - existingSale.purchasePrice) * newQuantity;
    const previousStock = existingSale.product.stock;
    const newStock = previousStock - quantityDiff;

    // Update sale and adjust stock in a transaction
    const [updatedSale] = await prisma.$transaction([
      prisma.sale.update({
        where: { id },
        data: {
          quantity: newQuantity,
          sellingPrice: newSellingPrice,
          profit: newProfit,
        },
        include: { product: true },
      }),
      // Adjust stock based on quantity difference
      ...(quantityDiff !== 0
        ? [
            prisma.product.update({
              where: { id: existingSale.productId },
              data: {
                stock: { decrement: quantityDiff },
              },
            }),
          ]
        : []),
    ]);

    // Log stock movement if quantity changed
    if (quantityDiff !== 0) {
      try {
        await prisma.stockMovement.create({
          data: {
            productId: existingSale.productId,
            type: quantityDiff > 0 ? "STOCK_OUT" : "STOCK_IN",
            quantity: Math.abs(quantityDiff),
            previousStock,
            newStock,
            reason: `Sale updated - quantity changed from ${existingSale.quantity} to ${newQuantity}`,
            referenceId: id,
          },
        });
      } catch (stockError) {
        console.error("Failed to log stock movement for sale update:", stockError);
      }
    }

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE a sale and restore stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the sale first to get the quantity and product info
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    const previousStock = sale.product.stock;
    const newStock = previousStock + sale.quantity;

    // Delete the sale and restore the stock in a transaction
    await prisma.$transaction([
      // Delete the sale
      prisma.sale.delete({
        where: { id },
      }),
      // Restore the stock
      prisma.product.update({
        where: { id: sale.productId },
        data: {
          stock: { increment: sale.quantity },
        },
      }),
    ]);

    // Log stock movement for the deleted sale (stock restored) - non-blocking
    try {
      await prisma.stockMovement.create({
        data: {
          productId: sale.productId,
          type: "STOCK_IN",
          quantity: sale.quantity,
          previousStock,
          newStock,
          reason: `Sale deleted - ${sale.quantity} unit(s) restored`,
          referenceId: id,
        },
      });
    } catch (stockError) {
      console.error("Failed to log stock movement for sale deletion:", stockError);
      // Don't fail the deletion if stock movement logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Sale deleted and stock restored",
      restoredQuantity: sale.quantity 
    });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
