import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { AnalysisResponse } from '../types';

interface ButtonBarProps {
  imageFile: File | null;
  analysisResult: AnalysisResponse | null;
  isLoading: boolean;
  isGenerating: boolean;
  isGeneratingDescription: boolean;
  canAnalyze: boolean;
  currentLayerNumber: number;
  onClearImage: () => void;
  onAnalyze: () => void;
  onGenerateDescription: () => void;
  onIsolateLayer: () => void;
  onApproveLayer: () => void;
  onRerunIsolation: () => void;
}

export const ButtonBar: React.FC<ButtonBarProps> = ({
  imageFile,
  analysisResult,
  isLoading,
  isGenerating,
  isGeneratingDescription,
  canAnalyze,
  currentLayerNumber,
  onClearImage,
  onAnalyze,
  onGenerateDescription,
  onIsolateLayer,
  onApproveLayer,
  onRerunIsolation,
}) => {
  // Determine which buttons to show based on state
  const getActiveButtons = () => {
    if (!imageFile) {
      return null; // No buttons when no image
    }

    // Show loading state during auto-processing
    if (isLoading || isGeneratingDescription) {
      return (
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <LoadingSpinner />
          <span className="font-medium">
            {isLoading ? 'Analyzing layer...' : 'Generating isolation description...'}
          </span>
        </div>
      );
    }

    // If layer is approved, show success state
    if (analysisResult?.layer_approved) {
      return (
        <div className="flex items-center justify-center gap-2 text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">Layer 1 Approved - Ready for Layer 2</span>
        </div>
      );
    }

    // If layer is isolated but not approved, show approval buttons
    if (analysisResult?.layer_isolated) {
      return (
        <>
          <button
            onClick={onApproveLayer}
            className="flex-1 max-w-xs inline-flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Approve Layer {currentLayerNumber}
          </button>
          <button
            onClick={onRerunIsolation}
            className="flex-1 max-w-xs inline-flex items-center justify-center px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-run Isolation
          </button>
        </>
      );
    }

    // If isolation description exists, show isolate button (primary action)
    if (analysisResult?.isolation_description) {
      return (
        <button
          onClick={onIsolateLayer}
          disabled={isGenerating}
          className={`flex-1 max-w-md inline-flex items-center justify-center px-6 py-2.5 text-white font-bold rounded-lg transition-all focus:outline-none
            ${isGenerating
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 animate-pulse'
            }`}
        >
          {isGenerating && <LoadingSpinner />}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {isGenerating ? 'Isolating Layer...' : `Isolate Layer ${currentLayerNumber}`}
        </button>
      );
    }

    // Shouldn't reach here with auto-processing
    return null;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {imageFile && (
            <button
              onClick={onClearImage}
              disabled={isLoading || isGenerating || isGeneratingDescription}
              className="px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Image
            </button>
          )}
          
          <div className="flex-1 flex justify-center gap-3">
            {getActiveButtons()}
          </div>
        </div>
      </div>
    </div>
  );
};