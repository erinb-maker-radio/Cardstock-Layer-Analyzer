import React, { useState } from 'react';
import type { AnalysisResponse } from '../types';

interface AnalysisResultProps {
  result: AnalysisResponse;
  layerNumber?: number;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, layerNumber = 1 }) => {
  const [showDetails, setShowDetails] = useState(true);

  const getStatusBadge = () => {
    if (result.layer_approved) {
      return <span className="text-xs px-2 py-1 bg-green-600/30 text-green-400 rounded-full">Approved</span>;
    }
    if (result.layer_isolated) {
      return <span className="text-xs px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded-full">Isolated</span>;
    }
    if (result.isolation_description) {
      return <span className="text-xs px-2 py-1 bg-blue-600/30 text-blue-400 rounded-full">Description Ready</span>;
    }
    return <span className="text-xs px-2 py-1 bg-slate-600/30 text-slate-400 rounded-full">Analyzed</span>;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-indigo-400">Layer {layerNumber} Analysis</h2>
          {getStatusBadge()}
        </div>
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
        <div className="space-y-3">
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
    </div>
  );
};