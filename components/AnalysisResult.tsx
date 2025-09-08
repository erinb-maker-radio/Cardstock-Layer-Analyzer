import React, { useState } from 'react';
import type { AnalysisResponse } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface AnalysisResultProps {
  result: AnalysisResponse;
  onGenerateIsolationDescription: () => void;
  onIsolateLayer: (description: string) => void;
  onApproveLayer: () => void;
  onRerunIsolation: () => void;
  isGeneratingDescription: boolean;
  isIsolating: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ 
  result, 
  onGenerateIsolationDescription, 
  onIsolateLayer, 
  onApproveLayer,
  onRerunIsolation,
  isGeneratingDescription, 
  isIsolating 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-indigo-400">Layer 1 Analysis</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showDetails && (
        <div className="space-y-3 mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">Description</h3>
            <p className="text-slate-300 text-sm bg-slate-900/50 p-2 rounded border border-slate-700">
              {result.layer_1_description}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">Reasoning</h3>
            <p className="text-slate-300 text-sm bg-slate-900/50 p-2 rounded border border-slate-700">
              {result.reasoning}
            </p>
          </div>
          {result.isolation_description && (
            <div>
              <h3 className="font-semibold text-sm text-slate-200 mb-1">Isolation Description</h3>
              <p className="text-slate-300 text-sm bg-slate-900/50 p-2 rounded border border-slate-700">
                {result.isolation_description}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!result.isolation_description ? (
          <button
            onClick={onGenerateIsolationDescription}
            disabled={isGeneratingDescription}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 text-sm text-white font-bold rounded-lg transition-all focus:outline-none
              ${isGeneratingDescription
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
              }`}
          >
            {isGeneratingDescription && <LoadingSpinner />}
            {isGeneratingDescription ? 'Generating...' : 'Generate Description'}
          </button>
        ) : !result.layer_isolated ? (
          <button
            onClick={() => onIsolateLayer(result.isolation_description!)}
            disabled={isIsolating}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 text-sm text-white font-bold rounded-lg transition-all focus:outline-none
              ${isIsolating
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500'
              }`}
          >
            {isIsolating && <LoadingSpinner />}
            {isIsolating ? 'Isolating...' : 'Isolate Layer'}
          </button>
        ) : null}
      </div>
    </div>
  );
};