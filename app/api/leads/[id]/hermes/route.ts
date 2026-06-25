import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { analyzeLeadWithHermesOnly } from "@/lib/lead-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { id } = await context.params;
    const lead = await analyzeLeadWithHermesOnly(id);
    return NextResponse.json({ analysis: { priority: lead.analysisPriority, summary: lead.analysisSummary, missingData: lead.analysisMissingData } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível consultar o HS Agent." }, { status: 400 });
  }
}
