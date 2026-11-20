import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, VALID_SESSION_VALUE } from "@/lib/auth";

export const runtime = "edge";

const PILOT_EMAIL = process.env.PILOT_USER_EMAIL || "marilia.cras@saoluis.ma.gov.br";
const PILOT_PASS = process.env.PILOT_USER_PASS || "cras2026";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (email === PILOT_EMAIL && password === PILOT_PASS) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, VALID_SESSION_VALUE, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return NextResponse.json({ success: true, user: { name: "Marília", email } });
    }

    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Erro interno de autenticação" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}

