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

export default async function Dashboard() {
  const session = await requireAdmin();
  const dashboard = await postgresLeadRepository.dashboard();
  const integrations = integrationHealth();
  const groupedLeads = crmStages.reduce(
    (acc, stage) => ({ ...acc, [stage.id]: dashboard.recentLeads.filter((lead) => crmStage(lead) === stage.id) }),
    {} as Record<CrmStage, Lead[]>,
  );

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">OPERAÇÃO COMERCIAL</p>
          <h1>Painel HS</h1>
          <p>Olá, {session.email}.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="logout" type="submit">Sair</button>
        </form>
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

      <section className="crm-board-section">
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

      <HermesLeadChat />

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
    </main>
  );
}
