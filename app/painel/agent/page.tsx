import { AgentPanel, PageHeader } from "@/components/painel/dashboard-sections";

export default function AgentPage() {
  return (
    <>
      <PageHeader
        eyebrow="HS AGENT"
        title="Prospecção e operação"
        description="Peça buscas B2C, resumos comerciais e ações operacionais com base nas ferramentas conectadas ao Agent."
        actionHref="/painel/automacoes"
        actionLabel="Ver automações"
      />
      <AgentPanel />
    </>
  );
}
