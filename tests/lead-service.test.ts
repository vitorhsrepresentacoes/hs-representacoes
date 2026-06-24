import { describe, expect, it, vi } from "vitest";
import { submitLead } from "@/lib/lead-service";
import type { HermesAnalysis, Lead, LeadInput } from "@/lib/types";
import type { LeadRepository } from "@/lib/leads-repository";

const input: LeadInput = {
  name: "Joana da Silva", phone: "+5511999999999", modality: "Financiamento de caminhão",
  goal: "Quero comprar um caminhão para ampliar minha operação.", valueRange: "R$ 200 mil a R$ 300 mil",
  city: "Campinas, SP", timeline: "Nos próximos 30 dias", consent: true,
};
const analysis: HermesAnalysis = {
  modality: "Financiamento de caminhão", priority: "alta", summary: "Lead busca caminhão para ampliar operação e pretende avançar em 30 dias.", missingData: [], recommendation: "Victor deve ligar para entender o veículo desejado e documentação necessária.",
};

function leadFrom(source: LeadInput): Lead {
  return { ...source, id: "lead-1", consentAt: new Date(), analysisStatus: "processing", analysisPriority: null, analysisSummary: null, analysisMissingData: [], analysisError: null, ghlStatus: "pending", ghlContactId: null, ghlOpportunityId: null, createdAt: new Date(), updatedAt: new Date() };
}

function repository(): LeadRepository {
  let current = leadFrom(input);
  return {
    create: vi.fn(async (value) => { current = leadFrom(value); return current; }),
    get: vi.fn(async () => current),
    setAnalysis: vi.fn(async (_, value) => { current = { ...current, analysisStatus: "completed", analysisPriority: value.priority, analysisSummary: value.summary, analysisMissingData: value.missingData }; return current; }),
    setReviewRequired: vi.fn(async (_, error) => { current = { ...current, analysisStatus: "review_required", analysisError: error }; return current; }),
    setGhlSynced: vi.fn(async (_, contactId, opportunityId) => { current = { ...current, ghlStatus: "synced", ghlContactId: contactId, ghlOpportunityId: opportunityId }; }),
    setGhlFailed: vi.fn(async () => { current = { ...current, ghlStatus: "failed" }; }),
    dashboard: vi.fn(async () => ({ totalLeads: 1, leadsToday: 1, qualifiedLeads: 1, recentLeads: [current] })),
  };
}

describe("submitLead", () => {
  it("persists, analyzes and syncs a valid lead exactly once", async () => {
    const repo = repository();
    const syncGhl = vi.fn(async () => ({ contactId: "contact-1", opportunityId: "opportunity-1" }));
    const result = await submitLead(input, { repository: repo, analyze: vi.fn(async () => analysis), syncGhl });
    expect(result.analysisStatus).toBe("completed");
    expect(repo.create).toHaveBeenCalledOnce();
    expect(repo.setAnalysis).toHaveBeenCalledOnce();
    expect(syncGhl).toHaveBeenCalledOnce();
    expect(repo.setGhlSynced).toHaveBeenCalledWith("lead-1", "contact-1", "opportunity-1");
  });

  it("keeps the lead and marks review required when Hermes fails", async () => {
    const repo = repository();
    const result = await submitLead(input, { repository: repo, analyze: vi.fn(async () => { throw new Error("Hermes indisponível"); }), syncGhl: vi.fn() });
    expect(result.analysisStatus).toBe("review_required");
    expect(repo.setReviewRequired).toHaveBeenCalledWith("lead-1", "Hermes indisponível");
  });

  it("keeps a completed analysis when GHL is temporarily unavailable", async () => {
    const repo = repository();
    const result = await submitLead(input, { repository: repo, analyze: vi.fn(async () => analysis), syncGhl: vi.fn(async () => { throw new Error("GHL indisponível"); }) });
    expect(result.analysisStatus).toBe("completed");
    expect(repo.setGhlFailed).toHaveBeenCalledOnce();
  });
});
