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
  if (!baseUrl || !token) throw new Error("Integração Hermes não configurada.");
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
  if (!candidate) throw new Error("Hermes não retornou análise estruturada.");
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
    throw new Error("Hermes redirecionou para login. Configure uma credencial de API válida no servidor Hermes.");
  }
  if (!response.ok) throw new Error(`Hermes respondeu com status ${response.status}.`);
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
        "Você é o assistente interno de prospecção da HS Representações.",
        "Use a integração Apollo disponível para pesquisar novos leads de acordo com o pedido do usuário.",
        "Responda em português, de forma direta, com os leads e dados que o Apollo retornar.",
        "Se não houver resultados ou a integração Apollo não estiver disponível, diga isso claramente.",
        "Nunca invente dados, nem sugira aprovação de crédito, taxas ou prazos.",
      ].join(" "),
      input: JSON.stringify({ pedidoDeProspeccao: message }),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (response.redirected || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Hermes redirecionou para login. Configure uma credencial de API válida no servidor Hermes.");
  }
  if (!response.ok) throw new Error(`Hermes respondeu com status ${response.status}.`);
  const answer = extractText((await response.json()) as HermesResponse).trim();
  if (!answer) throw new Error("Hermes não retornou uma resposta.");
  return answer;
}
