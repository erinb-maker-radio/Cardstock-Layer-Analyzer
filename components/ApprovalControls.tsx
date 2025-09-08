import React from 'react';

interface ApprovalControlsProps {
  showControls: boolean;
  onApprove: () => void;
  onRerun: () => void;
  isApproved: boolean;
}

export const ApprovalControls: React.FC<ApprovalControlsProps> = ({ 
  showControls, 
  onApprove, 
  onRerun,
  isApproved
}) => {
  if (!showControls) return null;

  if (isApproved) {
    return (
      <div className="bg-green-900/30 rounded-lg p-3 border border-green-700 animate-fade-in">
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 font-semibold">Layer 1 Approved - Ready for Layer 2</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 animate-fade-in">
      <p className="text-sm text-slate-300 mb-3 text-center">Review the isolated layer above. Is this correct?</p>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Approve & Continue
        </button>
        <button
          onClick={onRerun}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-run
        </button>
      </div>
    </div>
  );
};