import { LeadsTable, PageHeader } from "@/components/painel/dashboard-sections";
import { postgresLeadRepository } from "@/lib/leads-repository";

export default async function LeadsPage() {
  const dashboard = await postgresLeadRepository.dashboard();

  return (
    <>
      <PageHeader
        eyebrow="LEADS"
        title="Solicitações recentes"
        description="Tabela operacional com análise da IA, prioridade, status de CRM e ações de revisão."
        actionHref="/painel/crm"
        actionLabel="Ver CRM"
      />
      <LeadsTable leads={dashboard.recentLeads} />
    </>
  );
}
