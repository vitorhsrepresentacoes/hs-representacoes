import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { retryLeadAnalysis } from "@/lib/lead-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    await retryLeadAnalysis(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível reprocessar." }, { status: 400 });
  }
}
