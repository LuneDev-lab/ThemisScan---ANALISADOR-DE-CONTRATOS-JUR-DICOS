export interface RiskClause {
  clause: string;
  reason: string;
  impact: string;
  recommendation: string;
}

export interface FavorableTerm {
  clause: string;
  benefit: string;
}

export interface AnalysisResponse {
  executiveSummary: string;
  contractType: string;
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
  riskClauses: RiskClause[];
  missingTerms: string[];
  favorableTerms: FavorableTerm[];
  practicalRecommendations: string[];
  clientQuestions: string[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}