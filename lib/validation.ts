import { z } from "zod";
import { modalities } from "@/lib/types";

const optionalUtm = z.string().trim().max(120).optional().or(z.literal(""));

export const leadInputSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  phone: z.string().trim().min(10, "Informe um WhatsApp válido.").max(30),
  modality: z.enum(modalities, { error: "Escolha uma modalidade." }),
  goal: z.string().trim().min(8, "Conte brevemente o que você precisa.").max(500),
  valueRange: z.string().trim().min(3, "Informe uma faixa de valor aproximada.").max(80),
  city: z.string().trim().min(2, "Informe sua cidade ou região.").max(120),
  timeline: z.string().trim().min(2, "Informe quando pretende avançar.").max(120),
  consent: z.literal(true, { error: "É necessário autorizar o contato sobre sua solicitação." }),
  utmSource: optionalUtm,
  utmMedium: optionalUtm,
  utmCampaign: optionalUtm,
});

export const hermesAnalysisSchema = z.object({
  modality: z.enum(modalities),
  priority: z.enum(["alta", "media", "baixa"]),
  summary: z.string().trim().min(20).max(1000),
  missingData: z.array(z.string().trim().min(1).max(160)).max(8),
  recommendation: z.string().trim().min(10).max(500),
});

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) {
    throw new Error("Informe um WhatsApp válido com DDD.");
  }
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}
