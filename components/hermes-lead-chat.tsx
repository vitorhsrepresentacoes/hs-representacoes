"use client";

import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function HermesLeadChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Posso buscar novos leads pelo HS Agent. Ex.: “Encontre decisores de transportadoras em Campinas interessados em financiamento de caminhão”." }]);
  const [loading, setLoading] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setInput(""); setLoading(true); setMessages((current) => [...current, { role: "user", content: message }]);
    const response = await fetch("/api/hermes/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    setMessages((current) => [...current, { role: "assistant", content: response.ok ? payload.answer : payload.error ?? "Não foi possível consultar o HS Agent." }]);
  }

  return <section className="hermes-chat" aria-labelledby="hermes-chat-title"><div><p className="eyebrow">HS AGENT</p><h2 id="hermes-chat-title">Prospecção de novos leads</h2></div><div className="chat-messages" aria-live="polite">{messages.map((message, index) => <div className={`chat-message chat-${message.role}`} key={index}><p>{message.content}</p></div>)}{loading && <div className="chat-message chat-assistant"><p>Consultando HS Agent…</p></div>}</div><form className="chat-form" onSubmit={send}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ex.: Encontre gestores de transportadoras em São Paulo" aria-label="Pedido de prospecção ao HS Agent" /><button className="button button-primary" type="submit" disabled={loading}>Enviar</button></form></section>;
}
