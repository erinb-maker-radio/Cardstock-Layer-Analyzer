import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { RulesPanel } from './components/RulesPanel';
import { ImageViewer } from './components/ImageViewer';
import { AnalysisResult } from './components/AnalysisResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { analyzeImageLayer, isolateLayer } from './services/geminiService';
import type { AnalysisResponse } from './types';

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
  const [error, setError] = useState<string | null>(null);

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


  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const handleClearImage = useCallback(() => {
    setImageFile(null);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const result = await analyzeImageLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType);
      setAnalysisResult(result);
    // FIX: Add type annotation to the catch clause variable to resolve "Cannot find name 'err'" error, which can be caused by strict TypeScript configurations.
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleIsolateLayer = useCallback(async (description: string) => {
      if (!imageFile) {
        setError("Original image file not found for isolation.");
        return;
      }
      setIsGenerating(true);
      setError(null);
      try {
          const imagePart = await fileToGenerativePart(imageFile);
          const result = await isolateLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType, description);
          const newBlob = new Blob([new Uint8Array(atob(result.base64).split('').map(char => char.charCodeAt(0)))], { type: result.mimeType });
          const newFile = new File([newBlob], "isolated_layer.png", { type: result.mimeType });
          setImageFile(newFile);
          setAnalysisResult(null); // Clear old analysis AFTER new image is set
          
      // FIX: Add type annotation to the catch clause variable to resolve "Cannot find name 'err'" error.
      } catch (err: any) {
          setError(err instanceof Error ? err.message : "An unknown error occurred during layer isolation.");
      } finally {
          setIsGenerating(false);
      }
  }, [imageFile]);


  const canAnalyze = imageFile && !isLoading && !isGenerating;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="flex flex-col gap-6">
            {!imageFile ? (
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                disabled={isLoading || isGenerating}
              />
            ) : (
              <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between border border-slate-700 animate-fade-in">
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-100">Image Loaded:</p>
                  <p className="text-xs text-slate-400 truncate pr-2" title={imageFile.name}>{imageFile.name}</p>
                </div>
                <button 
                  onClick={handleClearImage}
                  disabled={isLoading || isGenerating}
                  className="flex-shrink-0 text-sm font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Change
                </button>
              </div>
            )}
            
            {imageFile && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <button
                    onClick={handleAnalyzeClick}
                    disabled={!canAnalyze}
                    className="w-full inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
                  >
                    {isLoading && <LoadingSpinner />}
                    {isLoading ? 'Analyzing Layer 1...' : 'Identify Layer 1'}
                </button>
                
                {!isLoading && analysisResult && (
                  <AnalysisResult 
                    result={analysisResult} 
                    onIsolateLayer={handleIsolateLayer}
                    isIsolating={isGenerating}
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
      <footer className="container mx-auto p-4 md:p-8">
        <RulesPanel />
      </footer>
    </div>
  );
}