import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

// DELETE /api/parties/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const party = await prisma.party.findUnique({ where: { id } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    await prisma.party.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting party:", error);
    return NextResponse.json({ error: "Failed to delete party" }, { status: 500 });
  }
}
