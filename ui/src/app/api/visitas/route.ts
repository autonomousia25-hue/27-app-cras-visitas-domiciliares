import { NextResponse } from "next/server";
import { fetchVisitas, appendVisitas } from "@/lib/sheets";

export const runtime = "edge";

export async function GET() {
  try {
    const data = await fetchVisitas();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support single visit or batch array of visits
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: "Nenhum dado informado" }, { status: 400 });
    }

    const insertedCount = await appendVisitas(items);
    return NextResponse.json({ success: true, count: insertedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao inserir visitas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

