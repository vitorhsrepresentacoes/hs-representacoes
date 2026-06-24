"use client";

import { useState } from "react";

export function RetryAnalysis({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  async function retry() {
    setState("sending");
    const response = await fetch(`/api/leads/${id}/retry`, { method: "POST" });
    if (!response.ok) { setState("error"); return; }
    window.location.reload();
  }
  return <button className="retry-button" onClick={retry} disabled={state === "sending"}>{state === "sending" ? "Reprocessando..." : state === "error" ? "Tentar novamente" : "Reprocessar"}</button>;
}
