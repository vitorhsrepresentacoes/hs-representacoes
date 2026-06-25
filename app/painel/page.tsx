import { requireAdmin } from "@/lib/auth";
import { ghlContactUrl } from "@/lib/ghl";
import { postgresLeadRepository } from "@/lib/leads-repository";
import { RetryAnalysis } from "@/components/retry-analysis";
import { HermesLeadChat } from "@/components/hermes-lead-chat";
import { integrationHealth } from "@/lib/integrations";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
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

const sidebarItems = [
  { label: "Visão geral", href: "#visao-geral" },
  { label: "CRM HS", href: "#crm-hs" },
  { label: "Automações", href: "#automacoes" },
  { label: "Integrações", href: "#integracoes" },
  { label: "HS Agent", href: "#hs-agent" },
  { label: "Chat equipe", href: "#chat-equipe" },
];

const automationCards = [
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
];

const teamMessages = [
  { name: "Comercial", time: "09:12", text: "Priorizar leads de financiamento imobiliário com prazo menor que 6 meses." },
  { name: "HS Agent", time: "09:16", text: "Detectei oportunidade B2C: aluguel alto + intenção de compra em Sorocaba." },
  { name: "Operação", time: "09:20", text: "Separar contatos com CRM pendente para revisão antes do disparo." },
];

export default async function Dashboard() {
  const session = await requireAdmin();
  const dashboard = await postgresLeadRepository.dashboard();
  const integrations = integrationHealth();
  const groupedLeads = crmStages.reduce(
    (acc, stage) => ({ ...acc, [stage.id]: dashboard.recentLeads.filter((lead) => crmStage(lead) === stage.id) }),
    {} as Record<CrmStage, Lead[]>,
  );

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Navegação do painel">
        <a className="sidebar-brand" href="#visao-geral">
          <img src="/assets/logo.svg" alt="" width="34" height="34" />
          <span>HS OS</span>
        </a>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <div className="sidebar-agent">
          <span>HS Agent</span>
          <strong>Operação B2C ativa</strong>
          <p>Prospecção, follow-up e análise comercial conectadas ao painel.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="logout sidebar-logout" type="submit">Sair</button>
        </form>
      </aside>

      <section className="dashboard" id="visao-geral">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">OPERAÇÃO COMERCIAL</p>
            <h1>Painel HS</h1>
            <p>Olá, {session.email}.</p>
          </div>
          <a className="logout" href="/">Ver site</a>
        </header>

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

        <section className="ops-grid">
          <article className="automation-panel" id="automacoes">
            <div className="table-heading">
              <div>
                <p className="eyebrow">AUTOMAÇÕES</p>
                <h2>Rotinas do HS Agent</h2>
              </div>
              <span className="integration-status integration-status-external">Prontas para ativar</span>
            </div>
            <div className="automation-list">
              {automationCards.map((automation) => (
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
          </article>

          <article className="team-chat-panel" id="chat-equipe">
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
          </article>
        </section>

      <section className="crm-board-section" id="crm-hs">
        <div className="table-heading">
          <div>
            <p className="eyebrow">CRM HS</p>
            <h2>Pipeline comercial simples</h2>
          </div>
          <a href="/">Ver site</a>
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

      <section className="integration-panel" id="integracoes">
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

      <div id="hs-agent">
        <HermesLeadChat />
      </div>

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
              {dashboard.recentLeads.length === 0 ? (
                <tr><td colSpan={7} className="empty">Ainda não há solicitações.</td></tr>
              ) : (
                dashboard.recentLeads.map((lead) => (
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
      </section>
    </main>
  );
}
