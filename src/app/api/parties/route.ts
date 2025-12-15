import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/lib/api-auth";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// GET /api/parties?type=CUSTOMER|VENDOR
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const type = request.nextUrl.searchParams.get("type");

    const parties = await prisma.party.findMany({
      where: type === "CUSTOMER" || type === "VENDOR" ? { type } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error("Error fetching parties:", error);
    return NextResponse.json({ error: "Failed to fetch parties" }, { status: 500 });
  }
}

// POST /api/parties
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { type, name, phone } = body as {
      type?: "CUSTOMER" | "VENDOR";
      name?: string;
      phone?: string;
    };

    if (type !== "CUSTOMER" && type !== "VENDOR") {
      return NextResponse.json({ error: "Valid party type is required" }, { status: 400 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }

    const normalizedName = normalizeName(name);

    const party = await prisma.party.upsert({
      where: {
        type_normalizedName: {
          type,
          normalizedName,
        },
      },
      update: {
        name: name.trim(),
        phone: phone?.trim() || null,
      },
      create: {
        type,
        name: name.trim(),
        normalizedName,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error("Error creating party:", error);
    return NextResponse.json({ error: "Failed to create party" }, { status: 500 });
  }
}
