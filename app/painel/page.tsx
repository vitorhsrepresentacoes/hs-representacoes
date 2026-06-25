import { requireAdmin } from "@/lib/auth";
import { ghlContactUrl } from "@/lib/ghl";
import { postgresLeadRepository } from "@/lib/leads-repository";
import { RetryAnalysis } from "@/components/retry-analysis";
import { HermesLeadChat } from "@/components/hermes-lead-chat";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return ({ completed: "Analisado", review_required: "Revisão necessária", processing: "Analisando", pending: "Pendente" } as Record<string, string>)[status] ?? status;
}

export default async function Dashboard() {
  const session = await requireAdmin();
  const dashboard = await postgresLeadRepository.dashboard();
  return <main className="dashboard"><header className="dashboard-header"><div><p className="eyebrow">OPERAÇÃO COMERCIAL</p><h1>Painel HS</h1><p>Olá, {session.email}.</p></div><form action="/api/auth/logout" method="post"><button className="logout" type="submit">Sair</button></form></header><section className="metrics"><article><span>Total de leads</span><strong>{dashboard.totalLeads}</strong></article><article><span>Novos hoje</span><strong>{dashboard.leadsToday}</strong></article><article><span>Qualificados pela IA</span><strong>{dashboard.qualifiedLeads}</strong></article></section><HermesLeadChat /><section className="lead-table-section"><div className="table-heading"><div><p className="eyebrow">ÚLTIMAS SOLICITAÇÕES</p><h2>Leads recentes</h2></div><a href="/">Ver site</a></div><div className="table-scroll"><table><thead><tr><th>Lead</th><th>Modalidade</th><th>Análise</th><th>Prioridade</th><th>Recebido</th><th>GHL</th><th></th></tr></thead><tbody>{dashboard.recentLeads.length === 0 ? <tr><td colSpan={7} className="empty">Ainda não há solicitações.</td></tr> : dashboard.recentLeads.map((lead) => <tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.phone}</small></td><td>{lead.modality}</td><td><span className={`status status-${lead.analysisStatus}`}>{statusLabel(lead.analysisStatus)}</span></td><td>{lead.analysisPriority ?? "—"}</td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(lead.createdAt)}</td><td>{lead.ghlContactId ? <a className="ghl-link" target="_blank" rel="noreferrer" href={ghlContactUrl(lead.ghlContactId)}>Abrir</a> : lead.ghlStatus === "failed" ? "Falhou" : "Pendente"}</td><td>{lead.analysisStatus === "review_required" && <RetryAnalysis id={lead.id} />}</td></tr>)}</tbody></table></div></section></main>;
}
