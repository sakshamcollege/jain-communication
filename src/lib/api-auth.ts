import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type AuthResult = 
  | { authorized: false; response: NextResponse; session?: never }
  | { authorized: true; session: Session; response?: never };

export async function checkAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role === "BUYER") {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, session };
}
