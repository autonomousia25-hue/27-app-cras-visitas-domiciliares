import { NextResponse } from "next/server";
import { updateVisitaStatus } from "@/lib/sheets";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowNumber = parseInt(id, 10);

    if (isNaN(rowNumber) || rowNumber < 7) {
      return NextResponse.json({ error: "Linha inválida" }, { status: 400 });
    }

    const {
      status,
      cadUnicoAtualizado,
      data,
      observacoes,
      bairro,
      endereco,
      referencia,
      telefone,
    } = await req.json();

    await updateVisitaStatus(
      rowNumber,
      status,
      cadUnicoAtualizado,
      data,
      observacoes,
      bairro,
      endereco,
      referencia,
      telefone
    );
    return NextResponse.json({ success: true, rowNumber });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar visita";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
