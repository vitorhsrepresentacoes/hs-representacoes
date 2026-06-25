import { IntegrationsPanel, PageHeader } from "@/components/painel/dashboard-sections";
import { integrationHealth } from "@/lib/integrations";

export default function IntegracoesPage() {
  const integrations = integrationHealth();

  return (
    <>
      <PageHeader
        eyebrow="INTEGRAÇÕES"
        title="Operação conectada"
        description="Status dos pontos que sustentam a operação: CRM, HS Agent e Google Workspace conectado pelo host do agente."
      />
      <IntegrationsPanel integrations={integrations} />
    </>
  );
}
