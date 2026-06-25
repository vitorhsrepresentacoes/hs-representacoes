type IntegrationStatus = "configured" | "missing" | "external";

export type IntegrationHealth = {
  name: string;
  status: IntegrationStatus;
  detail: string;
};

function hasAll(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

export function integrationHealth(): IntegrationHealth[] {
  return [
    {
      name: "CRM GoHighLevel",
      status: hasAll(["GHL_API_TOKEN", "GHL_LOCATION_ID", "GHL_PIPELINE_ID", "GHL_STAGE_NEW_ID", "GHL_STAGE_QUALIFIED_ID", "GHL_VICTOR_USER_ID"]) ? "configured" : "missing",
      detail: "Sincroniza leads como contatos e oportunidades no pipeline comercial.",
    },
    {
      name: "HS Agent",
      status: hasAll(["HERMES_BASE_URL", "HERMES_API_TOKEN"]) ? "configured" : "missing",
      detail: "Analisa leads e executa ações nas ferramentas conectadas ao agente.",
    },
    {
      name: "Google Workspace",
      status: "external",
      detail: "Conectado pelo host do HS Agent; não usa credencial Google dentro deste app.",
    },
  ];
}
