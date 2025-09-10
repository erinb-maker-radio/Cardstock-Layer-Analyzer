/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * Main application component with testing mode integration.
 * Contains UI state management and core user interactions.
 * Testing mode provides 10-iteration consistency validation.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { RulesPanel } from './components/RulesPanel';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisResult } from './components/AnalysisResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TestingSuite } from './components/TestingSuite';
import { MultiApproachTestSuite } from './components/MultiApproachTestSuite';
import { ButtonBar } from './components/ButtonBar';
import { LayersPanel } from './components/LayersPanel';
import { ApiMonitor } from './components/ApiMonitor';
import { ExportButton } from './components/ExportButton';
import { analyzeImageLayer, generateIsolationDescription, isolateCurrentLayer, isolateLayer } from './services/geminiService';
import { layerStorage } from './services/layerStorage';
import { fileToGenerativePart } from './utils/imageUtils';
import { weldLayersClientSide, generateWeldingDescriptionClientSide } from './utils/clientWelding';
import type { AnalysisResponse, ProjectState, LayerData } from './types';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
  const [isWelding, setIsWelding] = useState<boolean>(false);
  const [isGeneratingWeldingDescription, setIsGeneratingWeldingDescription] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Project state for multi-layer management
  const [project, setProject] = useState<ProjectState>({
    layers: [],
    currentLayerIndex: 0
  });

  useEffect(() => {
    // Add global animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Effect to manage object URL lifecycle
  useEffect(() => {
    if (!imageFile) {
      setImageUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImageUrl(objectUrl);

    // Clean up the object URL when the component unmounts or the file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);


  const handleImageUpload = useCallback(async (file: File) => {
    setImageFile(file);
    setAnalysisResult(null);
    setError(null);
    
    // Initialize project with original image
    const newProject: ProjectState = {
      originalImage: file,
      currentWorkingImage: file,
      layers: [],
      currentLayerIndex: 0
    };
    setProject(newProject);
    layerStorage.saveProject(newProject);
    
    // Auto-run analysis after image upload
    setTimeout(() => {
      handleAnalyzeClick(file);
    }, 500); // Small delay for UX
  }, []);

  const handleClearImage = useCallback(() => {
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
    
    // Reset project state
    setProject({
      layers: [],
      currentLayerIndex: 0
    });
    layerStorage.clearProject();
  }, []);

  const handleAnalyzeClick = useCallback(async (file?: File) => {
    const targetFile = file || imageFile;
    if (!targetFile) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const imagePart = await fileToGenerativePart(targetFile);
      const result = await analyzeImageLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType);
      setAnalysisResult(result);
      
      // Auto-generate isolation description after analysis
      setTimeout(() => {
        handleGenerateIsolationDescription(targetFile, result);
      }, 500);
    // FIX: Add type annotation to the catch clause variable to resolve "Cannot find name 'err'" error, which can be caused by strict TypeScript configurations.
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleGenerateIsolationDescription = useCallback(async (file?: File, result?: AnalysisResponse, layerNum?: number) => {
    const targetFile = file || imageFile;
    const targetResult = result || analysisResult;
    const currentLayerNum = layerNum || (project.currentLayerIndex + 1);
    
    if (!targetFile || !targetResult) {
      setError("Analysis result not available for generating isolation description.");
      return;
    }
    setIsGeneratingDescription(true);
    setError(null);
    try {
      // Don't send image for description - just use the analysis text
      const isolationDescription = await generateIsolationDescription(
        "", // No image needed, we already have the analysis
        "text/plain", 
        targetResult.layer_1_description,
        currentLayerNum
      );
      setAnalysisResult({
        ...targetResult,
        isolation_description: isolationDescription
      });
      
      // Auto-isolate after description for all layers
      setTimeout(() => {
        handleIsolateLayerWithFile(isolationDescription, targetFile);
      }, 500);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during isolation description generation.");
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [imageFile, analysisResult, project.currentLayerIndex]);

  const handleIsolateLayerWithFile = useCallback(async (description: string, sourceFile: File) => {
      if (!sourceFile) {
        setError("Original image file not found for isolation.");
        return;
      }
      setIsGenerating(true);
      setError(null);
      try {
          const imagePart = await fileToGenerativePart(sourceFile);
          const currentLayerNum = project.currentLayerIndex + 1;
          
          // Use isolateLayer for all layers (like in working version)
          const result = await isolateLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType, description, currentLayerNum);
            
          const newBlob = new Blob([new Uint8Array(atob(result.base64).split('').map(char => char.charCodeAt(0)))], { type: result.mimeType });
          const newFile = new File([newBlob], `isolated_layer_${currentLayerNum}.png`, { type: result.mimeType });
          
          setAnalysisResult(prev => prev ? { 
            ...prev, 
            layer_isolated: true,
            isolated_image: newFile,
            // Mark that isolation needs approval before welding
            isolation_needs_approval: currentLayerNum > 1
          } : null);
          setImageFile(newFile);
          
          // For Layer 2+, DON'T auto-weld - wait for user approval
          // Auto-welding removed - user must approve isolation first
          
      } catch (err: any) {
          setError(err instanceof Error ? err.message : "An unknown error occurred during layer isolation.");
      } finally {
          setIsGenerating(false);
      }
  }, [project.currentLayerIndex]);

  const handleIsolateLayer = useCallback(async (description: string) => {
      const sourceImage = imageFile || project.originalImage;
      if (!sourceImage) {
        setError("Original image file not found for isolation.");
        return;
      }
      handleIsolateLayerWithFile(description, sourceImage);
  }, [imageFile, project.originalImage, handleIsolateLayerWithFile]);

  const handleGenerateWeldingDescription = useCallback(async (isolatedImage: File, currentLayerDescription: string, layerNum: number) => {
    if (!project.originalImage) {
      setError("Original image not found for welding description.");
      return;
    }
    setIsGeneratingWeldingDescription(true);
    setError(null);
    try {
      // Get isolated layer as base64 to extract dominant color
      const isolatedImagePart = await fileToGenerativePart(isolatedImage, false);
      const previousLayerDescriptions = project.layers.map(layer => layer.description);
      
      // Generate description using client-side logic (no API call)
      const weldingDescription = generateWeldingDescriptionClientSide(
        currentLayerDescription,
        layerNum,
        previousLayerDescriptions,
        '0,0,0' // Will be updated during welding with actual color
      );
      
      setAnalysisResult(prev => prev ? { 
        ...prev, 
        welding_description: weldingDescription 
      } : null);
      
      // Auto-weld after description
      setTimeout(() => {
        handleWeldLayers(isolatedImage, currentLayerDescription, layerNum);
      }, 500);
      
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during welding description generation.");
    } finally {
      setIsGeneratingWeldingDescription(false);
    }
  }, [project.originalImage, project.layers]);

  const handleWeldLayers = useCallback(async (isolatedImage: File, currentLayerDescription: string, layerNum: number) => {
    if (!project.originalImage) {
      setError("Original image not found for welding.");
      return;
    }
    setIsWelding(true);
    setError(null);
    try {
      // Convert current layer to base64
      const isolatedImagePart = await fileToGenerativePart(isolatedImage, false);
      
      // Get all previous layer images as base64
      const previousLayersBase64: string[] = [];
      for (const layer of project.layers) {
        if (layer.isolatedImage) {
          const layerPart = await fileToGenerativePart(layer.isolatedImage, false);
          previousLayersBase64.push(layerPart.inlineData.data);
        }
      }
      
      // Perform client-side welding (no API call!)
      const result = await weldLayersClientSide(
        isolatedImagePart.inlineData.data,
        previousLayersBase64
      );
      
      // Update welding description with actual color
      const previousLayerDescriptions = project.layers.map(layer => layer.description);
      const updatedWeldingDescription = generateWeldingDescriptionClientSide(
        currentLayerDescription,
        layerNum,
        previousLayerDescriptions,
        result.dominantColor
      );
      
      // Convert base64 back to File
      const weldedBlob = new Blob([new Uint8Array(atob(result.base64).split('').map(char => char.charCodeAt(0)))], { type: result.mimeType });
      const weldedFile = new File([weldedBlob], `welded_layer_${layerNum}.png`, { type: result.mimeType });
      
      setImageFile(weldedFile);
      setAnalysisResult(prev => prev ? { 
        ...prev, 
        layer_welded: true,
        welded_image: weldedFile,
        welding_description: updatedWeldingDescription
      } : null);
      
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during layer welding.");
    } finally {
      setIsWelding(false);
    }
  }, [project.originalImage, project.layers]);

  // New function to approve isolation and proceed to welding
  const handleApproveIsolation = useCallback(async () => {
    if (!analysisResult || !imageFile) return;
    
    const currentLayerNum = project.currentLayerIndex + 1;
    
    // Mark isolation as approved and proceed to welding
    setAnalysisResult(prev => prev ? { 
      ...prev, 
      isolation_approved: true,
      isolation_needs_approval: false 
    } : null);
    
    // Get the current layer description from analysis
    const currentLayerDescription = analysisResult[`layer_${currentLayerNum}_description`] || analysisResult.layer_2_description || '';
    
    // Proceed to welding
    setTimeout(() => {
      handleGenerateWeldingDescription(imageFile, currentLayerDescription, currentLayerNum);
    }, 500);
  }, [analysisResult, imageFile, project.currentLayerIndex, handleGenerateWeldingDescription]);

  const handleApproveLayer = useCallback(async () => {
    if (!analysisResult || !imageFile) return;
    
    // Mark current analysis as approved
    setAnalysisResult(prev => prev ? { ...prev, layer_approved: true } : null);
    
    // Save current layer to project
    const currentLayerNum = project.currentLayerIndex + 1;
    
    const newLayer: LayerData = {
      id: `layer-${currentLayerNum}`,
      name: `Layer ${currentLayerNum}`,
      description: analysisResult.layer_1_description, // This will be dynamic based on layer
      reasoning: analysisResult.reasoning,
      isolation_description: analysisResult.isolation_description,
      imageFile: imageFile,
      isolated: true,
      approved: true
    };
    
    // Update project with new layer
    const updatedProject = {
      ...project,
      originalImage: project.originalImage || imageFile,
      layers: [...project.layers, newLayer],
      currentLayerIndex: project.currentLayerIndex + 1
    };
    
    setProject(updatedProject);
    layerStorage.saveProject(updatedProject);
    
    // Start Layer 2 analysis automatically
    setTimeout(() => {
      startNextLayerAnalysis(updatedProject);
    }, 1000);
  }, [analysisResult, imageFile, project]);
  
  const startNextLayerAnalysis = useCallback(async (currentProject: ProjectState) => {
    if (!currentProject.originalImage) return;
    
    const nextLayerNum = currentProject.currentLayerIndex + 1;
    const previousLayerDescriptions = currentProject.layers.map(layer => layer.description);
    
    // Reset to original image for next layer analysis
    setImageFile(currentProject.originalImage);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(true);
    
    // Start analysis for next layer using original image
    try {
      const imagePart = await fileToGenerativePart(currentProject.originalImage);
      
      const result = await analyzeImageLayer(
        imagePart.inlineData.data, 
        imagePart.inlineData.mimeType, 
        nextLayerNum, 
        previousLayerDescriptions
      );
      
      // Convert result to expected format
      const layerDescriptionKey = `layer_${nextLayerNum}_description`;
      const adaptedResult: AnalysisResponse = {
        layer_1_description: result[layerDescriptionKey] || result.layer_1_description || `Layer ${nextLayerNum} description not found`,
        reasoning: result.reasoning,
      };
      
      setAnalysisResult(adaptedResult);
      
      // Auto-generate isolation description for all layers
      setTimeout(() => {
        handleGenerateIsolationDescription(currentProject.originalImage, adaptedResult, nextLayerNum);
      }, 500);
      
    } catch (err: any) {
      setError(err instanceof Error ? err.message : `An error occurred analyzing Layer ${nextLayerNum}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRerunIsolation = useCallback(() => {
    // Reset isolation and welding states to start over
    setAnalysisResult(prev => prev ? { 
      ...prev, 
      layer_isolated: false,
      layer_welded: false,
      isolation_needs_approval: false,
      isolation_approved: false,
      isolated_image: undefined,
      welded_image: undefined,
      welding_description: undefined
    } : null);
    
    // For Layer 2+, we might want to go back to the original image
    const currentLayerNum = project.currentLayerIndex + 1;
    if (currentLayerNum > 1 && project.originalImage) {
      setImageFile(project.originalImage);
    }
    
    // Auto-run isolation again if we have a description
    if (analysisResult?.isolation_description) {
      setTimeout(() => {
        handleIsolateLayer(analysisResult.isolation_description);
      }, 100);
    }
  }, [project, analysisResult]);


  const canAnalyze = imageFile && !isLoading && !isGenerating && !isGeneratingDescription && !isWelding && !isGeneratingWeldingDescription;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {/* API Monitor */}
        <ApiMonitor />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-3">
            {!imageFile ? (
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                disabled={isLoading || isGenerating || isGeneratingDescription}
              />
            ) : null}
            
            {imageFile && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {/* Export button */}
                <div className="flex justify-end">
                  <ExportButton 
                    project={project}
                    currentImage={imageFile}
                    currentLayerNumber={project.currentLayerIndex + 1}
                  />
                </div>
                
                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                {analysisResult && (
                  <AnalysisResult 
                    result={analysisResult} 
                    layerNumber={project.currentLayerIndex + 1}
                  />
                )}
              </div>
            )}
          </div>

          {/* Middle Column: Viewer */}
          <div className="lg:sticky lg:top-24">
            <ImageViewer imageUrl={imageUrl} />
          </div>
          
          {/* Right Column: Layers Panel */}
          <div className="lg:sticky lg:top-24">
            <LayersPanel project={project} />
          </div>
        </div>
      </main>
      <footer className="container mx-auto p-4 pb-20">
        <RulesPanel />
      </footer>
      
      <ButtonBar
        imageFile={imageFile}
        analysisResult={analysisResult}
        error={error}
        isLoading={isLoading}
        isGenerating={isGenerating}
        isGeneratingDescription={isGeneratingDescription}
        isWelding={isWelding}
        isGeneratingWeldingDescription={isGeneratingWeldingDescription}
        canAnalyze={canAnalyze}
        currentLayerNumber={project.currentLayerIndex + 1}
        onClearImage={handleClearImage}
        onAnalyze={handleAnalyzeClick}
        onGenerateDescription={handleGenerateIsolationDescription}
        onIsolateLayer={() => analysisResult?.isolation_description && handleIsolateLayer(analysisResult.isolation_description)}
        onApproveLayer={handleApproveLayer}
        onApproveIsolation={handleApproveIsolation}
        onRerunIsolation={handleRerunIsolation}
      />
    </div>
  );
}