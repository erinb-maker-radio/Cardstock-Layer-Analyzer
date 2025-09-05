import React from 'react';
import type { AnalysisResponse } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface AnalysisResultProps {
  result: AnalysisResponse;
  onIsolateLayer: (description: string) => void;
  isIsolating: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onIsolateLayer, isIsolating }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">Layer 1 Analysis Complete</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-200 mb-2">Description of Layer 1</h3>
          <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-md border border-slate-700">
            {result.layer_1_description}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-200 mb-2">Reasoning</h3>
          <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-md border border-slate-700">
            {result.reasoning}
          </p>
        </div>

        <div className="border-t border-slate-700 pt-6 flex justify-center">
            <button
                onClick={() => onIsolateLayer(result.layer_1_description)}
                disabled={isIsolating}
                className={`
                  inline-flex items-center justify-center px-8 py-3 text-white font-bold rounded-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-opacity-50
                  ${isIsolating
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 focus:ring-4 focus:ring-indigo-500'
                  }
                `}
            >
                {isIsolating && <LoadingSpinner />}
                {!isIsolating && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 11.428a2.286 2.286 0 00-4.856 0M4.572 11.428a2.286 2.286 0 014.856 0" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.714v18.572" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.572 4.572L19.428 19.428" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.572 19.428L19.428 4.572" />
                    </svg>
                )}
                {isIsolating ? 'Isolating Layer...' : 'Isolate Layer 1'}
            </button>
        </div>
      </div>
    </div>
  );
};