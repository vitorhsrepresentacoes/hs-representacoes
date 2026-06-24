export const modalities = [
  "Financiamento de veículo",
  "Financiamento de caminhão",
  "Financiamento imobiliário",
  "Consórcio",
  "Ainda não sei",
] as const;

export type Modality = (typeof modalities)[number];
export type AnalysisStatus = "pending" | "processing" | "completed" | "review_required";
export type GhlStatus = "pending" | "synced" | "failed";

export type LeadInput = {
  name: string;
  phone: string;
  modality: Modality;
  goal: string;
  valueRange: string;
  city: string;
  timeline: string;
  consent: true;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type HermesAnalysis = {
  modality: Modality;
  priority: "alta" | "media" | "baixa";
  summary: string;
  missingData: string[];
  recommendation: string;
};

export type Lead = Omit<LeadInput, "consent"> & {
  id: string;
  consentAt: Date;
  analysisStatus: AnalysisStatus;
  analysisPriority: HermesAnalysis["priority"] | null;
  analysisSummary: string | null;
  analysisMissingData: string[];
  analysisError: string | null;
  ghlStatus: GhlStatus;
  ghlContactId: string | null;
  ghlOpportunityId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DashboardData = {
  totalLeads: number;
  leadsToday: number;
  qualifiedLeads: number;
  recentLeads: Lead[];
};
