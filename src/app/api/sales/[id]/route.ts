import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// DELETE a sale and restore stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

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
