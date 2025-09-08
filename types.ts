export interface AnalysisResponse {
  layer_1_description: string;
  reasoning: string;
  isolation_description?: string;
  layer_isolated?: boolean;
  layer_approved?: boolean;
}
