import type { HermesAnalysis, Lead } from "@/lib/types";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

type GhlConfig = {
  token: string; locationId: string; pipelineId: string; newStageId: string;
  qualifiedStageId: string; victorUserId: string;
};

type GhlContactResponse = { contact?: { id?: string }; id?: string };
type GhlOpportunityResponse = { opportunity?: { id?: string }; id?: string };

function getConfig(): GhlConfig {
  const config = {
    token: process.env.GHL_API_TOKEN,
    locationId: process.env.GHL_LOCATION_ID,
    pipelineId: process.env.GHL_PIPELINE_ID,
    newStageId: process.env.GHL_STAGE_NEW_ID,
    qualifiedStageId: process.env.GHL_STAGE_QUALIFIED_ID,
    victorUserId: process.env.GHL_VICTOR_USER_ID,
  };
  if (Object.values(config).some((value) => !value)) throw new Error("Integração GHL não configurada.");
  return config as GhlConfig;
}

function customField(id: string | undefined, value: string) {
  return id ? [{ id, field_value: value }] : [];
}

async function ghlFetch<T>(path: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${GHL_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GHL respondeu com status ${response.status}: ${detail.slice(0, 240)}`);
  }
  return response.json() as Promise<T>;
}

export async function syncLeadToGhl(lead: Lead, analysis: HermesAnalysis) {
  const config = getConfig();
  const customFields = [
    ...customField(process.env.GHL_FIELD_MODALITY_ID, analysis.modality),
    ...customField(process.env.GHL_FIELD_GOAL_ID, lead.goal),
    ...customField(process.env.GHL_FIELD_VALUE_RANGE_ID, lead.valueRange),
    ...customField(process.env.GHL_FIELD_TIMELINE_ID, lead.timeline),
    ...customField(process.env.GHL_FIELD_AI_SUMMARY_ID, analysis.summary),
    ...customField(process.env.GHL_FIELD_PRIORITY_ID, analysis.priority),
  ];
  const [firstName, ...lastName] = lead.name.split(" ");
  const contact = await ghlFetch<GhlContactResponse>("/contacts/upsert", config.token, {
    locationId: config.locationId,
    firstName,
    lastName: lastName.join(" "),
    name: lead.name,
    phone: lead.phone,
    city: lead.city,
    source: "Site HS Representações",
    assignedTo: config.victorUserId,
    tags: ["origem:site", `modalidade:${analysis.modality}`, `prioridade:${analysis.priority}`],
    customFields,
  });
  const contactId = contact.contact?.id ?? contact.id;
  if (!contactId) throw new Error("GHL não retornou o ID do contato.");

  const opportunity = await ghlFetch<GhlOpportunityResponse>("/opportunities/", config.token, {
    locationId: config.locationId,
    pipelineId: config.pipelineId,
    pipelineStageId: analysis.priority === "baixa" ? config.newStageId : config.qualifiedStageId,
    contactId,
    assignedTo: config.victorUserId,
    name: `${lead.name} — ${analysis.modality}`,
    status: "open",
    source: "Site HS Representações",
  });
  const opportunityId = opportunity.opportunity?.id ?? opportunity.id;
  if (!opportunityId) throw new Error("GHL não retornou o ID da oportunidade.");
  return { contactId, opportunityId };
}

export function ghlContactUrl(contactId: string) {
  return process.env.GHL_LOCATION_ID ? `https://app.gohighlevel.com/v2/location/${process.env.GHL_LOCATION_ID}/contacts/detail/${contactId}` : "#";
}
