import React from 'react';

// This component is not used in the "Layer 1" version of the app.
// A local type definition is added to prevent build errors from a missing import.
type AnalysisRecord = {
  id: number;
  image: {
    url: string;
  };
  result: any; // Opaque type for unused component
};

interface HistoryPanelProps {
  history: AnalysisRecord[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, selectedId, onSelect }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Analysis History
      </h2>
      <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
        {history.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Your analysis history will appear here.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((record) => (
              <li key={record.id}>
                <button
                  onClick={() => onSelect(record.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-all duration-200 ${
                    selectedId === record.id
                      ? 'bg-indigo-900/50 ring-2 ring-indigo-500'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <img
                    src={record.image.url}
                    alt="Analysis thumbnail"
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-slate-600"
                  />
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-200">Analysis</p>
                    <p className="text-xs text-slate-400">
                      {new Date(record.id).toLocaleTimeString()}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};