/**
 * Layer Storage Service
 * Manages saving and retrieving layers for multi-layer projects
 */

import type { LayerData, ProjectState } from '../types';

class LayerStorageService {
  private storageKey = 'cardstock-analyzer-project';
  
  // Save project state to localStorage
  saveProject(project: ProjectState): void {
    try {
      // Convert Files to base64 for storage
      const serializedProject = {
        ...project,
        originalImage: project.originalImage ? this.fileToBase64(project.originalImage) : null,
        currentWorkingImage: project.currentWorkingImage ? this.fileToBase64(project.currentWorkingImage) : null,
        layers: project.layers.map(layer => ({
          ...layer,
          imageFile: layer.imageFile ? this.fileToBase64(layer.imageFile) : null
        }))
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(serializedProject));
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }
  
  // Load project state from localStorage
  async loadProject(): Promise<ProjectState | null> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Convert base64 back to Files
      return {
        ...parsed,
        originalImage: parsed.originalImage ? await this.base64ToFile(parsed.originalImage) : null,
        currentWorkingImage: parsed.currentWorkingImage ? await this.base64ToFile(parsed.currentWorkingImage) : null,
        layers: await Promise.all(parsed.layers.map(async (layer: any) => ({
          ...layer,
          imageFile: layer.imageFile ? await this.base64ToFile(layer.imageFile) : null
        })))
      };
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }
  
  // Clear project data
  clearProject(): void {
    localStorage.removeItem(this.storageKey);
  }
  
  // Add a layer to the project
  addLayer(project: ProjectState, layer: LayerData): ProjectState {
    return {
      ...project,
      layers: [...project.layers, layer]
    };
  }
  
  // Update a specific layer
  updateLayer(project: ProjectState, layerId: string, updates: Partial<LayerData>): ProjectState {
    return {
      ...project,
      layers: project.layers.map(layer => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    };
  }
  
  // Get current layer
  getCurrentLayer(project: ProjectState): LayerData | null {
    return project.layers[project.currentLayerIndex] || null;
  }
  
  // Move to next layer
  nextLayer(project: ProjectState): ProjectState {
    return {
      ...project,
      currentLayerIndex: project.currentLayerIndex + 1
    };
  }
  
  // Convert File to base64 for storage
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Convert base64 back to File
  private async base64ToFile(dataUrl: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], 'layer-image.png', { type: blob.type });
  }
  
  // Generate layer filename
  generateLayerFilename(layerIndex: number, approved: boolean = false): string {
    const suffix = approved ? '_approved' : '_isolated';
    return `layer_${layerIndex + 1}${suffix}.png`;
  }
  
  // Download layer as file (for user to save manually)
  downloadLayer(layer: LayerData, layerIndex: number): void {
    if (!layer.imageFile) return;
    
    const url = URL.createObjectURL(layer.imageFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.generateLayerFilename(layerIndex, layer.approved);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const layerStorage = new LayerStorageService();