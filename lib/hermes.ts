import { hermesAnalysisSchema } from "@/lib/validation";
import type { HermesAnalysis, Lead } from "@/lib/types";

type HermesResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function requireHermesConfig() {
  const baseUrl = process.env.HERMES_BASE_URL?.replace(/\/$/, "");
  const token = process.env.HERMES_API_TOKEN;
  if (!baseUrl || !token) throw new Error("Integração HS Agent não configurada.");
  return { baseUrl, token };
}

function extractText(payload: HermesResponse) {
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n") ?? "";
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!candidate) throw new Error("HS Agent não retornou análise estruturada.");
  return JSON.parse(candidate);
}

export async function analyzeLeadWithHermes(lead: Lead): Promise<HermesAnalysis> {
  const { baseUrl, token } = requireHermesConfig();
  const instructions = [
    "Você é o analista comercial interno da HS Representações.",
    "Analise o lead de crédito/consórcio sem prometer aprovação, taxa, prazo ou resultado.",
    "Nunca peça CPF, documento, conta bancária ou qualquer dado sensível.",
    "Responda exclusivamente com JSON válido, sem markdown, no formato:",
    '{"modality":"...","priority":"alta|media|baixa","summary":"...","missingData":["..."],"recommendation":"..."}',
    "A modalidade precisa ser uma das opções fornecidas no lead.",
  ].join(" ");

  const response = await fetch(`${baseUrl}/v1/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "hermes-agent",
      store: false,
      instructions,
      input: JSON.stringify({
        nome: lead.name,
        modalidadeInformada: lead.modality,
        objetivo: lead.goal,
        faixaDeValor: lead.valueRange,
        cidadeOuRegiao: lead.city,
        prazo: lead.timeline,
      }),
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("HS Agent redirecionou para login. Configure uma credencial de API válida no servidor.");
  }
  if (!response.ok) throw new Error(`HS Agent respondeu com status ${response.status}.`);
  const payload = (await response.json()) as HermesResponse;
  const parsed = extractJson(extractText(payload));
  return hermesAnalysisSchema.parse(parsed);
}

export async function chatWithHermes(message: string) {
  const { baseUrl, token } = requireHermesConfig();
  const response = await fetch(`${baseUrl}/v1/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "hermes-agent",
      store: false,
      instructions: [
        "Você é o HS Agent, assistente operacional interno da HS Representações.",
        "Use as ferramentas conectadas no Hermes quando disponíveis, incluindo CRM/GHL, Google Workspace e prospecção.",
        "Quando o usuário pedir leads, pesquise e retorne dados reais das ferramentas de prospecção.",
        "Quando o usuário pedir CRM, funil, contato, agenda ou e-mail, use as integrações conectadas apropriadas.",
        "Se uma integração solicitada não estiver disponível ou não retornar resultados, diga isso claramente.",
        "Nunca invente dados, nem sugira aprovação de crédito, taxas ou prazos.",
      ].join(" "),
      input: JSON.stringify({ pedidoDeProspeccao: message }),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("HS Agent redirecionou para login. Configure uma credencial de API válida no servidor.");
  }
  if (!response.ok) throw new Error(`HS Agent respondeu com status ${response.status}.`);
  const answer = extractText((await response.json()) as HermesResponse).trim();
  if (!answer) throw new Error("HS Agent não retornou uma resposta.");
  return answer;
}
