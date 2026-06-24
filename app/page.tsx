import { Suspense } from "react";
import { LeadForm } from "@/components/lead-form";

const solutions = [
  ["Financiamento de veículos", "Para quem quer trocar, comprar ou regularizar a conquista do próximo carro."],
  ["Caminhões e pesados", "Crédito pensado para colocar sua operação, frete ou frota em movimento."],
  ["Imóveis", "Orientação para transformar seu projeto de moradia ou investimento em plano de ação."],
  ["Consórcios", "Uma alternativa de planejamento para adquirir bens sem depender de uma única rota."],
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="inicio">
        <nav className="nav container"><a className="brand" href="#inicio"><img src="/assets/hs-representacoes-logo.svg" alt="HS Representações" width={48} height={48} /><span>HS Representações</span></a><a href="#solicitar" className="nav-cta">Solicitar atendimento</a></nav>
        <div className="container hero-content">
          <p className="eyebrow">CRÉDITO COM DIREÇÃO</p>
          <h1>Seu próximo passo merece <em>clareza</em>, não promessa vazia.</h1>
          <p className="hero-copy">A HS Representações entende seu momento, organiza a sua necessidade e encaminha você para um atendimento humano especializado em crédito e consórcio.</p>
          <div className="hero-actions"><a className="button button-primary" href="#solicitar">Entender minhas opções</a><a className="button button-secondary" href="#como-funciona">Como funciona</a></div>
          <div className="trust-row"><span>Atendimento personalizado</span><span>•</span><span>Sem envio de documentos pelo site</span><span>•</span><span>Contato humano</span></div>
        </div>
      </section>

      <section className="section container" id="solucoes">
        <div className="section-heading"><p className="eyebrow">POSSIBILIDADES</p><h2>Um caminho para o que você quer construir.</h2><p>Do veículo que move a rotina ao imóvel que vira patrimônio: começamos entendendo o seu objetivo.</p></div>
        <div className="solution-grid">{solutions.map(([title, description], index) => <article className="solution-card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="section process" id="como-funciona"><div className="container process-grid"><div><p className="eyebrow">SEM COMPLICAÇÃO</p><h2>Você explica. Nós organizamos o próximo passo.</h2></div><ol><li><strong>Conte seu objetivo</strong><span>Você compartilha a modalidade, valor aproximado e momento da sua decisão.</span></li><li><strong>Receba uma leitura inicial</strong><span>Organizamos as informações para que o especialista chegue preparado ao atendimento.</span></li><li><strong>Converse com quem resolve</strong><span>Um consultor humano da HS entra em contato para orientar os próximos passos.</span></li></ol></div></section>

      <section className="section container form-section" id="solicitar"><div className="form-intro"><p className="eyebrow">COMECE POR AQUI</p><h2>Vamos entender o seu momento.</h2><p>Preencha em menos de dois minutos. Seus dados serão usados somente para esta solicitação e para que nosso time entre em contato.</p><div className="privacy-callout"><strong>Importante:</strong> não pedimos CPF, senhas, documentos ou dados bancários neste formulário.</div></div><Suspense fallback={<div className="lead-form">Carregando formulário...</div>}><LeadForm /></Suspense></section>

      <section className="section faq container" id="faq"><div className="section-heading"><p className="eyebrow">DÚVIDAS COMUNS</p><h2>O que você precisa saber antes de começar.</h2></div><div className="faq-list"><details><summary>A HS aprova crédito?</summary><p>Não. A HS Representações entende sua necessidade e conduz o atendimento comercial. Aprovações, taxas e condições dependem da análise das instituições parceiras.</p></details><details><summary>Preciso enviar documentos agora?</summary><p>Não. Nesta etapa, coletamos apenas informações iniciais para direcionar o atendimento. A documentação só é tratada no momento apropriado, pelo canal seguro indicado pelo especialista.</p></details><details><summary>Posso buscar uma modalidade mesmo sem saber qual escolher?</summary><p>Sim. Selecione “Ainda não sei” e conte seu objetivo. O time usará isso como ponto de partida para orientar a conversa.</p></details></div></section>

      <footer><div className="container footer-content"><a className="brand" href="#inicio"><img src="/assets/hs-representacoes-logo.svg" alt="" width={36} height={36} /><span>HS Representações</span></a><p>Crédito e consórcio com atendimento humano.</p><a href="#solicitar">Solicitar atendimento</a></div></footer>
    </main>
  );
}
