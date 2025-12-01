import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
