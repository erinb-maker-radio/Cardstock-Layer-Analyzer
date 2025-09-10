/**
 * Export utilities for downloading separated layers
 */

/**
 * Download a single image file
 */
export function downloadImage(file: File, filename: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download all layers as a zip file
 */
export async function downloadAllLayers(layers: Array<{file: File, name: string}>) {
  // For now, download each file individually
  // In the future, could use a library like JSZip to create a zip file
  
  layers.forEach((layer, index) => {
    setTimeout(() => {
      downloadImage(layer.file, layer.name);
    }, index * 500); // Stagger downloads to avoid browser blocking
  });
}

/**
 * Create a project summary JSON file
 */
export function createProjectSummary(project: any): Blob {
  const summary = {
    exportDate: new Date().toISOString(),
    totalLayers: project.layers.length,
    layers: project.layers.map((layer: any, index: number) => ({
      layerNumber: index + 1,
      name: layer.name,
      description: layer.description,
      reasoning: layer.reasoning,
      approved: layer.approved
    }))
  };
  
  const jsonString = JSON.stringify(summary, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Export all project files
 */
export function exportProject(project: any, currentImage: File | null) {
  const filesToDownload: Array<{file: File, name: string}> = [];
  
  // Add original image
  if (project.originalImage) {
    filesToDownload.push({
      file: project.originalImage,
      name: 'original.png'
    });
  }
  
  // Add each layer's isolated image
  project.layers.forEach((layer: any, index: number) => {
    if (layer.imageFile) {
      filesToDownload.push({
        file: layer.imageFile,
        name: `layer_${index + 1}_${layer.name.toLowerCase().replace(/\s+/g, '_')}.png`
      });
    }
  });
  
  // Add current working image (if it's a welded layer)
  if (currentImage && project.layers.length > 0) {
    const currentLayerNum = project.currentLayerIndex + 1;
    if (currentLayerNum > 1) {
      filesToDownload.push({
        file: currentImage,
        name: `layer_${currentLayerNum}_welded.png`
      });
    }
  }
  
  // Add project summary
  const summaryBlob = createProjectSummary(project);
  const summaryFile = new File([summaryBlob], 'project_summary.json', { type: 'application/json' });
  filesToDownload.push({
    file: summaryFile,
    name: 'project_summary.json'
  });
  
  // Download all files
  downloadAllLayers(filesToDownload);
  
  return filesToDownload.length;
}