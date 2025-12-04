import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== "DEVELOPER" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();
  const { id } = await params;

  if (!["DEVELOPER", "OWNER", "BUYER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Role assignment restrictions
  if (session.user.role === "OWNER") {
    // Owner cannot assign Developer role
    if (role === "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized to assign Developer role" }, { status: 403 });
    }

    // Owner cannot modify a Developer
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (targetUser?.role === "DEVELOPER") {
      return NextResponse.json({ error: "Unauthorized to modify Developer" }, { status: 403 });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json(updatedUser);
}
