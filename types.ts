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
  layer_2_description?: string;
  reasoning: string;
  isolation_description?: string;
  welding_description?: string;
  layer_isolated?: boolean;
  layer_welded?: boolean;
  layer_approved?: boolean;
  isolation_needs_approval?: boolean;
  isolation_approved?: boolean;
  isolated_image?: File;
  welded_image?: File;
  [key: string]: any; // Allow dynamic layer_N_description fields
}

export interface ProjectState {
  originalImage?: File;
  currentWorkingImage?: File;
  layers: LayerData[];
  currentLayerIndex: number;
}
