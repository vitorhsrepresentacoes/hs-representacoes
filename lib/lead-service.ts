import { analyzeLeadWithHermes } from "@/lib/hermes";
import { syncLeadToGhl } from "@/lib/ghl";
import { postgresLeadRepository, type LeadRepository } from "@/lib/leads-repository";
import type { LeadInput } from "@/lib/types";

export type LeadServiceDependencies = {
  repository: LeadRepository;
  analyze: typeof analyzeLeadWithHermes;
  syncGhl: typeof syncLeadToGhl;
};

const defaultDependencies: LeadServiceDependencies = {
  repository: postgresLeadRepository,
  analyze: analyzeLeadWithHermes,
  syncGhl: syncLeadToGhl,
};

export async function submitLead(input: LeadInput, dependencies = defaultDependencies) {
  const lead = await dependencies.repository.create(input);
  try {
    const analysis = await dependencies.analyze(lead);
    const analyzedLead = await dependencies.repository.setAnalysis(lead.id, analysis);
    try {
      const ghl = await dependencies.syncGhl(analyzedLead, analysis);
      await dependencies.repository.setGhlSynced(lead.id, ghl.contactId, ghl.opportunityId);
    } catch (error) {
      await dependencies.repository.setGhlFailed(lead.id, error instanceof Error ? error.message : "Falha desconhecida no GHL.");
    }
    return { leadId: lead.id, analysisStatus: "completed" as const };
  } catch (error) {
    await dependencies.repository.setReviewRequired(lead.id, error instanceof Error ? error.message : "Falha desconhecida no Hermes.");
    return { leadId: lead.id, analysisStatus: "review_required" as const };
  }
}

export async function retryLeadAnalysis(id: string, dependencies = defaultDependencies) {
  const lead = await dependencies.repository.get(id);
  if (!lead) throw new Error("Lead não encontrado.");
  const analysis = await dependencies.analyze(lead);
  const analyzedLead = await dependencies.repository.setAnalysis(lead.id, analysis);
  try {
    const ghl = await dependencies.syncGhl(analyzedLead, analysis);
    await dependencies.repository.setGhlSynced(lead.id, ghl.contactId, ghl.opportunityId);
  } catch (error) {
    await dependencies.repository.setGhlFailed(id, error instanceof Error ? error.message : "Falha desconhecida no GHL.");
  }
}

/** Runs only the Hermes analysis. CRM synchronization is deliberately skipped. */
export async function analyzeLeadWithHermesOnly(id: string, dependencies = defaultDependencies) {
  const lead = await dependencies.repository.get(id);
  if (!lead) throw new Error("Lead não encontrado.");

  try {
    const analysis = await dependencies.analyze(lead);
    return await dependencies.repository.setAnalysis(lead.id, analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida no Hermes.";
    await dependencies.repository.setReviewRequired(id, message);
    throw error;
  }
}
