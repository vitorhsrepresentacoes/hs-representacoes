import { AutomationPanel, CrmBoard, IntegrationsPanel, Metrics, PageHeader, TeamChatPanel } from "@/components/painel/dashboard-sections";
import { integrationHealth } from "@/lib/integrations";
import { postgresLeadRepository } from "@/lib/leads-repository";

export default async function Dashboard() {
  const dashboard = await postgresLeadRepository.dashboard();
  const integrations = integrationHealth();

  return (
    <>
      <PageHeader
        eyebrow="OPERAÇÃO COMERCIAL"
        title="Painel HS"
        description="Visão geral da operação, com acesso rápido ao CRM, automações, integrações e equipe."
        actionHref="/"
        actionLabel="Ver site"
      />
      <Metrics dashboard={dashboard} />

      <section className="module-grid">
        <a href="/painel/crm">
          <span>CRM</span>
          <strong>Pipeline HS</strong>
          <p>Acompanhe entrada, qualificação, revisão e sincronização com GoHighLevel.</p>
        </a>
        <a href="/painel/automacoes">
          <span>HS Agent</span>
          <strong>Automações</strong>
          <p>Rotinas para follow-up, aniversário, resumo diário e leads B2C imobiliários.</p>
        </a>
        <a href="/painel/agent">
          <span>Prospecção</span>
          <strong>Chat com o Agent</strong>
          <p>Peça buscas B2C e ações operacionais usando as integrações conectadas.</p>
        </a>
        <a href="/painel/equipe">
          <span>Operação</span>
          <strong>Equipe</strong>
          <p>Espaço visual para alinhamento interno e próximos passos comerciais.</p>
        </a>
      </section>

      <section className="overview-split">
        <AutomationPanel compact />
        <TeamChatPanel />
      </section>

      <CrmBoard leads={dashboard.recentLeads} />
      <IntegrationsPanel integrations={integrations} />
    </>
  );
}
