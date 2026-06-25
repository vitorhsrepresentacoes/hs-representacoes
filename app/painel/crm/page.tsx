import { CrmBoard, PageHeader } from "@/components/painel/dashboard-sections";
import { postgresLeadRepository } from "@/lib/leads-repository";

export default async function CrmPage() {
  const dashboard = await postgresLeadRepository.dashboard();

  return (
    <>
      <PageHeader
        eyebrow="CRM HS"
        title="Pipeline comercial"
        description="Organize os leads por etapa e acompanhe o que precisa de análise, revisão ou envio para o CRM."
        actionHref="/painel/leads"
        actionLabel="Ver tabela"
      />
      <CrmBoard leads={dashboard.recentLeads} />
    </>
  );
}
