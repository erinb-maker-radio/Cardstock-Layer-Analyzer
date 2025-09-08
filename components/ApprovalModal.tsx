import React from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  onApprove: () => void;
  onRerun: () => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
  isOpen, 
  onApprove, 
  onRerun, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
        <div className="text-center space-y-6">
          <div className="text-6xl">🎉</div>
          
          <div>
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">
              Layer 1 Isolated Successfully!
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Review the isolated layer in the image viewer. Is this the correct Layer 1?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onApprove}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approve & Continue to Layer 2
            </button>
            
            <button
              onClick={onRerun}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-run Layer 1 Isolation
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
          >
            Dismiss (review manually)
          </button>
        </div>
      </div>
    </div>
  );
};