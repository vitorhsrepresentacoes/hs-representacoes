import { PageHeader, TeamChatPanel } from "@/components/painel/dashboard-sections";

export default function EquipePage() {
  return (
    <>
      <PageHeader
        eyebrow="EQUIPE"
        title="Alinhamento interno"
        description="Espaço visual para conversas da operação comercial, alertas do HS Agent e próximos passos."
      />
      <TeamChatPanel />
    </>
  );
}
