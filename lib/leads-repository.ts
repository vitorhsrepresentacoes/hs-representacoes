import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";
import type { DashboardData, HermesAnalysis, Lead, LeadInput } from "@/lib/types";

type LeadRow = {
  id: string; name: string; phone: string; modality: Lead["modality"]; goal: string;
  value_range: string; city: string; timeline: string; consent_at: Date;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  analysis_status: Lead["analysisStatus"]; analysis_priority: Lead["analysisPriority"];
  analysis_summary: string | null; analysis_missing_data: string[]; analysis_error: string | null;
  ghl_status: Lead["ghlStatus"]; ghl_contact_id: string | null; ghl_opportunity_id: string | null;
  created_at: Date; updated_at: Date;
};

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id, name: row.name, phone: row.phone, modality: row.modality, goal: row.goal,
    valueRange: row.value_range, city: row.city, timeline: row.timeline, consentAt: row.consent_at,
    utmSource: row.utm_source ?? undefined, utmMedium: row.utm_medium ?? undefined,
    utmCampaign: row.utm_campaign ?? undefined, analysisStatus: row.analysis_status,
    analysisPriority: row.analysis_priority, analysisSummary: row.analysis_summary,
    analysisMissingData: row.analysis_missing_data ?? [], analysisError: row.analysis_error,
    ghlStatus: row.ghl_status, ghlContactId: row.ghl_contact_id,
    ghlOpportunityId: row.ghl_opportunity_id, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export type LeadRepository = {
  create(input: LeadInput): Promise<Lead>;
  get(id: string): Promise<Lead | null>;
  setAnalysis(id: string, analysis: HermesAnalysis): Promise<Lead>;
  setReviewRequired(id: string, error: string): Promise<Lead>;
  setGhlSynced(id: string, contactId: string, opportunityId: string): Promise<void>;
  setGhlFailed(id: string, error: string): Promise<void>;
  dashboard(): Promise<DashboardData>;
};

export const postgresLeadRepository: LeadRepository = {
  async create(input) {
    const sql = getSql();
    const [row] = await sql<LeadRow[]>`
      insert into leads (id, name, phone, modality, goal, value_range, city, timeline, consent_at, utm_source, utm_medium, utm_campaign, analysis_status)
      values (${randomUUID()}, ${input.name}, ${input.phone}, ${input.modality}, ${input.goal}, ${input.valueRange}, ${input.city}, ${input.timeline}, now(), ${input.utmSource || null}, ${input.utmMedium || null}, ${input.utmCampaign || null}, 'processing')
      returning *`;
    return mapLead(row);
  },
  async get(id) {
    const sql = getSql();
    const [row] = await sql<LeadRow[]>`select * from leads where id = ${id}`;
    return row ? mapLead(row) : null;
  },
  async setAnalysis(id, analysis) {
    const sql = getSql();
    const [row] = await sql<LeadRow[]>`
      update leads set modality = ${analysis.modality}, analysis_status = 'completed', analysis_priority = ${analysis.priority}, analysis_summary = ${analysis.summary}, analysis_missing_data = ${analysis.missingData}, analysis_error = null, updated_at = now()
      where id = ${id} returning *`;
    return mapLead(row);
  },
  async setReviewRequired(id, error) {
    const sql = getSql();
    const [row] = await sql<LeadRow[]>`
      update leads set analysis_status = 'review_required', analysis_error = ${error.slice(0, 1000)}, updated_at = now()
      where id = ${id} returning *`;
    return mapLead(row);
  },
  async setGhlSynced(id, contactId, opportunityId) {
    const sql = getSql();
    await sql`update leads set ghl_status = 'synced', ghl_contact_id = ${contactId}, ghl_opportunity_id = ${opportunityId}, updated_at = now() where id = ${id}`;
  },
  async setGhlFailed(id, error) {
    const sql = getSql();
    await sql`update leads set ghl_status = 'failed', analysis_error = coalesce(analysis_error || E'\n', '') || ${`GHL: ${error}`.slice(0, 1000)}, updated_at = now() where id = ${id}`;
  },
  async dashboard() {
    const sql = getSql();
    const [metrics] = await sql<{ total: string; today: string; qualified: string }[]>`
      select count(*) as total, count(*) filter (where created_at >= date_trunc('day', now())) as today, count(*) filter (where analysis_status = 'completed') as qualified from leads`;
    const rows = await sql<LeadRow[]>`select * from leads order by created_at desc limit 20`;
    return { totalLeads: Number(metrics.total), leadsToday: Number(metrics.today), qualifiedLeads: Number(metrics.qualified), recentLeads: rows.map(mapLead) };
  },
};
