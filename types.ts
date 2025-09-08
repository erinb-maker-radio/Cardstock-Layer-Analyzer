export interface LayerData {
  id: string;
  name: string;
  description: string;
  reasoning: string;
  isolation_description?: string;
  imageFile?: File;
  isolated?: boolean;
  approved?: boolean;
}

export interface AnalysisResponse {
  layer_1_description: string;
  reasoning: string;
  isolation_description?: string;
  layer_isolated?: boolean;
  layer_approved?: boolean;
}

export interface ProjectState {
  originalImage?: File;
  currentWorkingImage?: File;
  layers: LayerData[];
  currentLayerIndex: number;
}
