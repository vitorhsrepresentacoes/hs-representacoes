import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { chatWithHermes } from "@/lib/hermes";

const bodySchema = z.object({ message: z.string().trim().min(3, "Escreva uma busca.").max(500) });

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const { message } = bodySchema.parse(await request.json());
    const answer = await chatWithHermes(message);
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível consultar o HS Agent." }, { status: 400 });
  }
}
