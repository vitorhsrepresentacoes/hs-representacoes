"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { modalities } from "@/lib/types";

type FormState = "idle" | "sending" | "error";

export function LeadForm() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        consent: form.get("consent") === "on",
        utmSource: searchParams.get("utm_source") ?? "",
        utmMedium: searchParams.get("utm_medium") ?? "",
        utmCampaign: searchParams.get("utm_campaign") ?? "",
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Não foi possível enviar. Tente novamente.");
      setState("error");
      return;
    }
    window.location.assign(`/obrigado?lead=${encodeURIComponent(result.leadId)}`);
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <label>Nome completo<input required name="name" autoComplete="name" placeholder="Como podemos te chamar?" /></label>
        <label>Seu WhatsApp<input required name="phone" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" /></label>
        <label>Qual solução você busca?
          <select name="modality" defaultValue="" required>
            <option value="" disabled>Selecione uma opção</option>
            {modalities.map((modality) => <option key={modality} value={modality}>{modality}</option>)}
          </select>
        </label>
        <label>Faixa de valor aproximada<input required name="valueRange" placeholder="Ex.: R$ 80 mil a R$ 120 mil" /></label>
        <label>Cidade ou região<input required name="city" autoComplete="address-level2" placeholder="Ex.: Campinas, SP" /></label>
        <label>Quando pretende avançar?
          <select name="timeline" defaultValue="" required>
            <option value="" disabled>Selecione uma opção</option>
            <option>O quanto antes</option><option>Nos próximos 30 dias</option><option>Em até 3 meses</option><option>Ainda estou pesquisando</option>
          </select>
        </label>
      </div>
      <label className="full-field">Conte rapidamente seu objetivo
        <textarea required name="goal" rows={4} placeholder="Ex.: preciso adquirir um caminhão para ampliar minha operação." />
      </label>
      <label className="consent"><input required name="consent" type="checkbox" />
        <span>Autorizo a HS Representações a usar estes dados para analisar minha solicitação e entrar em contato. Não compartilhe documentos, CPF ou dados bancários aqui.</span>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary submit" disabled={state === "sending"} type="submit">
        {state === "sending" ? "Analisando solicitação..." : "Quero falar com um especialista"}
      </button>
      <p className="form-note">Sem compromisso. A análise de crédito e condições finais são realizadas pelas instituições parceiras.</p>
    </form>
  );
}
