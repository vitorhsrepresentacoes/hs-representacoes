import { requireAdmin } from "@/lib/auth";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const sidebarItems = [
  { label: "Visão geral", href: "/painel" },
  { label: "CRM HS", href: "/painel/crm" },
  { label: "Automações", href: "/painel/automacoes" },
  { label: "Integrações", href: "/painel/integracoes" },
  { label: "HS Agent", href: "/painel/agent" },
  { label: "Equipe", href: "/painel/equipe" },
  { label: "Leads", href: "/painel/leads" },
];

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Navegação do painel">
        <a className="sidebar-brand" href="/painel">
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
        <div className="sidebar-user">
          <span>Conta</span>
          <strong>{session.email}</strong>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="logout sidebar-logout" type="submit">Sair</button>
        </form>
      </aside>

      <section className="dashboard">{children}</section>
    </main>
  );
}
