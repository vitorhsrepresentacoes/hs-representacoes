import { AutomationPanel, PageHeader } from "@/components/painel/dashboard-sections";

export default function AutomacoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="AUTOMAÇÕES"
        title="Rotinas do HS Agent"
        description="Modelos operacionais para transformar intenção comercial em tarefas, follow-ups e alertas para a equipe."
        actionHref="/painel/agent"
        actionLabel="Abrir Agent"
      />
      <AutomationPanel />
    </>
  );
}
