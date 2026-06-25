import { HermesLeadChat } from "@/components/hermes-lead-chat";
import { RetryAnalysis } from "@/components/retry-analysis";
import { ghlContactUrl } from "@/lib/ghl";
import type { IntegrationHealth } from "@/lib/integrations";
import type { DashboardData, Lead } from "@/lib/types";

export function statusLabel(status: string) {
  return ({ completed: "Analisado", review_required: "Revisão necessária", processing: "Analisando", pending: "Pendente" } as Record<string, string>)[status] ?? status;
}

function integrationStatusLabel(status: string) {
  return ({ configured: "Configurado", missing: "Pendente", external: "No HS Agent" } as Record<string, string>)[status] ?? status;
}

const crmStages = [
  { id: "new", title: "Entrada", description: "Chegaram pelo site ou pelo HS Agent" },
  { id: "qualified", title: "Qualificados", description: "IA analisou e priorizou" },
  { id: "review", title: "Revisão", description: "Precisam de ajuste antes do CRM" },
  { id: "crm", title: "No CRM", description: "Sincronizados com GoHighLevel" },
] as const;

type CrmStage = (typeof crmStages)[number]["id"];

function crmStage(lead: Lead): CrmStage {
  if (lead.ghlStatus === "synced") return "crm";
  if (lead.analysisStatus === "review_required" || lead.ghlStatus === "failed") return "review";
  if (lead.analysisStatus === "completed") return "qualified";
  return "new";
}

function priorityLabel(priority: Lead["analysisPriority"]) {
  return priority ? `Prioridade ${priority}` : "Sem prioridade";
}

export const automationCards = [
  {
    title: "Aniversário do lead",
    trigger: "Todo dia às 09h",
    action: "HS Agent prepara uma mensagem personalizada e cria tarefa de envio no CRM.",
    status: "Modelo",
  },
  {
    title: "Follow-up sem resposta",
    trigger: "48h sem retorno",
    action: "Reescreve a abordagem pelo contexto do lead e sinaliza prioridade para a equipe.",
    status: "Pronto",
  },
  {
    title: "Aluguel para imóvel próprio",
    trigger: "Lead B2C em Sorocaba",
    action: "Segmenta quem paga aluguel, resume intenção de compra e sugere próxima conversa.",
    status: "B2C",
  },
  {
    title: "Resumo diário",
    trigger: "Fim do expediente",
    action: "Envia um resumo com novos leads, pendências, oportunidades quentes e falhas de integração.",
    status: "Workspace",
  },
  {
    title: "Lead quente sem atendimento",
    trigger: "Prioridade alta por 30 min",
    action: "Marca o contato como urgente, sugere mensagem e avisa a equipe no painel.",
    status: "CRM",
  },
  {
    title: "Pré-qualificação imobiliária",
    trigger: "Intenção de compra",
    action: "Confere objetivo, região, prazo e dados faltantes antes do repasse comercial.",
    status: "IA",
  },
];

export const teamMessages = [
  { name: "Comercial", time: "09:12", text: "Priorizar leads de financiamento imobiliário com prazo menor que 6 meses." },
  { name: "HS Agent", time: "09:16", text: "Detectei oportunidade B2C: aluguel alto + intenção de compra em Sorocaba." },
  { name: "Operação", time: "09:20", text: "Separar contatos com CRM pendente para revisão antes do disparo." },
];

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageHeader({ eyebrow, title, description, actionHref, actionLabel }: PageHeaderProps) {
  return (
    <header className="dashboard-header page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actionHref && actionLabel && <a className="logout" href={actionHref}>{actionLabel}</a>}
    </header>
  );
}

export function Metrics({ dashboard }: { dashboard: DashboardData }) {
  return (
    <section className="metrics">
      <article>
        <span>Total de leads</span>
        <strong>{dashboard.totalLeads}</strong>
      </article>
      <article>
        <span>Novos hoje</span>
        <strong>{dashboard.leadsToday}</strong>
      </article>
      <article>
        <span>Qualificados pela IA</span>
        <strong>{dashboard.qualifiedLeads}</strong>
      </article>
    </section>
  );
}

export function CrmBoard({ leads }: { leads: Lead[] }) {
  const groupedLeads = crmStages.reduce(
    (acc, stage) => ({ ...acc, [stage.id]: leads.filter((lead) => crmStage(lead) === stage.id) }),
    {} as Record<CrmStage, Lead[]>,
  );

  return (
    <section className="crm-board-section">
      <div className="table-heading">
        <div>
          <p className="eyebrow">CRM HS</p>
          <h2>Pipeline comercial simples</h2>
        </div>
        <a href="/painel/leads">Ver leads</a>
      </div>
      <div className="crm-board">
        {crmStages.map((stage) => (
          <article className="crm-column" key={stage.id}>
            <header>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </div>
              <span className="crm-count">{groupedLeads[stage.id].length}</span>
            </header>
            <div className="crm-card-list">
              {groupedLeads[stage.id].length === 0 ? (
                <p className="crm-empty">Nenhum lead nesta etapa.</p>
              ) : (
                groupedLeads[stage.id].slice(0, 6).map((lead) => (
                  <div className="crm-card" key={lead.id}>
                    <div>
                      <strong>{lead.name}</strong>
                      <small>{lead.phone}</small>
                    </div>
                    <span>{lead.modality}</span>
                    <small>{lead.city} · {lead.timeline}</small>
                    <div className="crm-card-meta">
                      <span className={`crm-chip crm-chip-${lead.analysisPriority ?? "none"}`}>{priorityLabel(lead.analysisPriority)}</span>
                      <span className={`status status-${lead.analysisStatus}`}>{statusLabel(lead.analysisStatus)}</span>
                    </div>
                    {lead.ghlContactId && (
                      <a className="ghl-link" target="_blank" rel="noreferrer" href={ghlContactUrl(lead.ghlContactId)}>Abrir no GHL</a>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AutomationPanel({ compact = false }: { compact?: boolean }) {
  const cards = compact ? automationCards.slice(0, 4) : automationCards;
  return (
    <section className="automation-panel">
      <div className="table-heading">
        <div>
          <p className="eyebrow">AUTOMAÇÕES</p>
          <h2>Rotinas do HS Agent</h2>
        </div>
        {compact ? <a href="/painel/automacoes">Ver tudo</a> : <span className="integration-status integration-status-external">Prontas para ativar</span>}
      </div>
      <div className="automation-list">
        {cards.map((automation) => (
          <div className="automation-card" key={automation.title}>
            <div>
              <strong>{automation.title}</strong>
              <small>{automation.trigger}</small>
            </div>
            <p>{automation.action}</p>
            <span>{automation.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IntegrationsPanel({ integrations }: { integrations: IntegrationHealth[] }) {
  return (
    <section className="integration-panel">
      <div>
        <p className="eyebrow">CRM E INTEGRAÇÕES</p>
        <h2>Operação conectada</h2>
      </div>
      <div className="integration-grid">
        {integrations.map((integration) => (
          <article key={integration.name}>
            <div>
              <strong>{integration.name}</strong>
              <span>{integration.detail}</span>
            </div>
            <span className={`integration-status integration-status-${integration.status}`}>{integrationStatusLabel(integration.status)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TeamChatPanel() {
  return (
    <section className="team-chat-panel">
      <div className="table-heading">
        <div>
          <p className="eyebrow">EQUIPE</p>
          <h2>Chat interno</h2>
        </div>
        <span className="chat-state">Visual</span>
      </div>
      <div className="team-chat-list">
        {teamMessages.map((message) => (
          <div className="team-message" key={`${message.name}-${message.time}`}>
            <div><strong>{message.name}</strong><span>{message.time}</span></div>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="team-chat-compose" aria-hidden="true">
        <span>Escrever mensagem para a equipe</span>
        <button type="button" disabled>Enviar</button>
      </div>
    </section>
  );
}

export function AgentPanel() {
  return (
    <div className="agent-page-panel">
      <HermesLeadChat />
    </div>
  );
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <section className="lead-table-section">
      <div className="table-heading">
        <div>
          <p className="eyebrow">ÚLTIMAS SOLICITAÇÕES</p>
          <h2>Leads recentes</h2>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Modalidade</th>
              <th>Análise</th>
              <th>Prioridade</th>
              <th>Recebido</th>
              <th>CRM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={7} className="empty">Ainda não há solicitações.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.name}</strong><small>{lead.phone}</small></td>
                  <td>{lead.modality}</td>
                  <td><span className={`status status-${lead.analysisStatus}`}>{statusLabel(lead.analysisStatus)}</span></td>
                  <td>{lead.analysisPriority ?? "—"}</td>
                  <td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(lead.createdAt)}</td>
                  <td>{lead.ghlContactId ? <a className="ghl-link" target="_blank" rel="noreferrer" href={ghlContactUrl(lead.ghlContactId)}>Abrir GHL</a> : lead.ghlStatus === "failed" ? "Falhou" : "Pendente"}</td>
                  <td>{lead.analysisStatus === "review_required" && <RetryAnalysis id={lead.id} />}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
