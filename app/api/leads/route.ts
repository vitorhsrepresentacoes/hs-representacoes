import { NextResponse } from "next/server";
import { submitLead } from "@/lib/lead-service";
import { normalizePhone, leadInputSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadInputSchema.parse(body);
    const result = await submitLead({ ...parsed, phone: normalizePhone(parsed.phone) });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar sua solicitação.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
