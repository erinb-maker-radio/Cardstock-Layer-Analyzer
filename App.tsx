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
import { analyzeImageLayer, generateIsolationDescription, isolateLayer } from './services/geminiService';
import { layerStorage } from './services/layerStorage';
import type { AnalysisResponse, ProjectState, LayerData } from './types';

// Helper to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);
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
    
    console.log('🔹 handleGenerateIsolationDescription called');
    console.log('🔹 targetFile:', targetFile ? 'exists' : 'missing');
    console.log('🔹 targetResult:', targetResult ? 'exists' : 'missing');
    console.log('🔹 layerNum parameter:', layerNum);
    console.log('🔹 currentLayerNum calculated:', currentLayerNum);
    
    if (!targetFile || !targetResult) {
      setError("Analysis result not available for generating isolation description.");
      return;
    }
    setIsGeneratingDescription(true);
    setError(null);
    try {
      const imagePart = await fileToGenerativePart(targetFile);
      const isolationDescription = await generateIsolationDescription(
        imagePart.inlineData.data, 
        imagePart.inlineData.mimeType, 
        targetResult.layer_1_description,
        currentLayerNum
      );
      setAnalysisResult({
        ...targetResult,
        isolation_description: isolationDescription
      });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during isolation description generation.");
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [imageFile, analysisResult, project.currentLayerIndex]);

  const handleIsolateLayer = useCallback(async (description: string) => {
      if (!imageFile) {
        setError("Original image file not found for isolation.");
        return;
      }
      setIsGenerating(true);
      setError(null);
      try {
          const imagePart = await fileToGenerativePart(imageFile);
          const currentLayerNum = project.currentLayerIndex + 1;
          console.log('🔸 Isolating layer', currentLayerNum, 'with description:', description);
          
          const result = await isolateLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType, description, currentLayerNum);
          const newBlob = new Blob([new Uint8Array(atob(result.base64).split('').map(char => char.charCodeAt(0)))], { type: result.mimeType });
          const newFile = new File([newBlob], "isolated_layer.png", { type: result.mimeType });
          setImageFile(newFile);
          setAnalysisResult(prev => prev ? { ...prev, layer_isolated: true } : null);
          
          
      } catch (err: any) {
          setError(err instanceof Error ? err.message : "An unknown error occurred during layer isolation.");
      } finally {
          setIsGenerating(false);
      }
  }, [imageFile, project.currentLayerIndex]);

  const handleApproveLayer = useCallback(async () => {
    if (!analysisResult || !imageFile) return;
    
    // Mark current analysis as approved
    setAnalysisResult(prev => prev ? { ...prev, layer_approved: true } : null);
    
    // Save current layer to project
    const currentLayerNum = project.currentLayerIndex + 1;
    console.log('Approving layer:', currentLayerNum);
    console.log('Current project state:', project);
    
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
    
    console.log('Starting analysis for layer:', nextLayerNum);
    console.log('Project currentLayerIndex:', currentProject.currentLayerIndex);
    console.log('Previous layer descriptions:', previousLayerDescriptions);
    
    // Reset to original image for next layer analysis
    setImageFile(currentProject.originalImage);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(true);
    
    // Start analysis for next layer using original image
    try {
      const imagePart = await fileToGenerativePart(currentProject.originalImage);
      console.log('About to call analyzeImageLayer with:', { 
        layerNumber: nextLayerNum, 
        previousLayersCount: previousLayerDescriptions.length 
      });
      
      const result = await analyzeImageLayer(
        imagePart.inlineData.data, 
        imagePart.inlineData.mimeType, 
        nextLayerNum, 
        previousLayerDescriptions
      );
      
      // Convert result to expected format (this is a temporary bridge)
      const layerDescriptionKey = `layer_${nextLayerNum}_description`;
      const adaptedResult: AnalysisResponse = {
        layer_1_description: result[layerDescriptionKey] || result.layer_1_description || `Layer ${nextLayerNum} description not found`,
        reasoning: result.reasoning,
      };
      
      console.log('Layer analysis result:', JSON.stringify(result, null, 2));
      console.log('Looking for key:', layerDescriptionKey);
      console.log('Adapted result:', JSON.stringify(adaptedResult, null, 2));
      
      setAnalysisResult(adaptedResult);
      
      // Auto-generate isolation description
      console.log('🔸 About to auto-generate isolation description for Layer', nextLayerNum);
      setTimeout(() => {
        console.log('🔸 Calling handleGenerateIsolationDescription');
        handleGenerateIsolationDescription(currentProject.originalImage, adaptedResult, nextLayerNum);
      }, 500);
      
    } catch (err: any) {
      setError(err instanceof Error ? err.message : `An error occurred analyzing Layer ${nextLayerNum}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRerunIsolation = useCallback(() => {
    setAnalysisResult(prev => prev ? { ...prev, layer_isolated: false } : null);
  }, []);


  const canAnalyze = imageFile && !isLoading && !isGenerating && !isGeneratingDescription;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-3">
            {!imageFile ? (
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                disabled={isLoading || isGenerating || isGeneratingDescription}
              />
            ) : (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 animate-fade-in">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Image Loaded</p>
                  <p className="text-xs text-slate-400 truncate" title={imageFile.name}>{imageFile.name}</p>
                </div>
              </div>
            )}
            
            {imageFile && (
              <div className="flex flex-col gap-3 animate-fade-in">
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

          {/* Right Column: Viewer */}
          <div className="lg:sticky lg:top-24">
            <ImageViewer imageUrl={imageUrl} />
          </div>
        </div>
      </main>
      <footer className="container mx-auto p-4 pb-20">
        <RulesPanel />
      </footer>
      
      <ButtonBar
        imageFile={imageFile}
        analysisResult={analysisResult}
        isLoading={isLoading}
        isGenerating={isGenerating}
        isGeneratingDescription={isGeneratingDescription}
        canAnalyze={canAnalyze}
        currentLayerNumber={project.currentLayerIndex + 1}
        onClearImage={handleClearImage}
        onAnalyze={handleAnalyzeClick}
        onGenerateDescription={handleGenerateIsolationDescription}
        onIsolateLayer={() => analysisResult?.isolation_description && handleIsolateLayer(analysisResult.isolation_description)}
        onApproveLayer={handleApproveLayer}
        onRerunIsolation={handleRerunIsolation}
      />
    </div>
  );
}