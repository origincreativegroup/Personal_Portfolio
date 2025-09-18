export interface AnalysisInsight {
  type: 'problem' | 'solution' | 'impact' | 'process' | 'metric' | string;
  confidence: number;
  content: string;
  evidence?: string[];
  source: string; // file ID or name
  [key: string]: unknown;
}

export interface ProblemAnalysis {
  primary: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
}

export interface SolutionAnalysis {
  primary: string;
  confidence: number;
  keyElements: string[];
  designPatterns: string[];
}

export interface ImpactAnalysis {
  primary: string;
  confidence: number;
  metrics: Array<{
    metric: string;
    before: string;
    after: string;
    change: string;
  }>;
  businessValue: string;
}

export interface ProjectNarrative {
  story: string;
  challenges: string[];
  process: string[];
}

export interface AnalysisResult {
  confidence: number;
  processingTime: number;
  filesAnalyzed: number;
  insights: number;
  problem: ProblemAnalysis;
  solution: SolutionAnalysis;
  impact: ImpactAnalysis;
  narrative: ProjectNarrative;
  suggestedTitle: string;
  suggestedCategory: string;
  tags: string[];
}
