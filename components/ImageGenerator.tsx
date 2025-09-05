import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ImageGeneratorProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  disabled: boolean;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ prompt, setPrompt, onGenerate, disabled }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Generate Concept Art
      </h2>
      <div className="flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          rows={3}
          className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
          disabled={disabled}
        />
        <button
          onClick={onGenerate}
          disabled={disabled}
          className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          {disabled ? <LoadingSpinner /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )}
          {disabled ? 'Creating...' : 'Create Image'}
        </button>
      </div>
    </div>
  );
};