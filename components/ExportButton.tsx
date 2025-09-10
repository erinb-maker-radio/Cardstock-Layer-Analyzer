import React, { useState } from 'react';
import { exportProject, downloadImage } from '../utils/exportUtils';
import type { ProjectState } from '../types';

interface ExportButtonProps {
  project: ProjectState;
  currentImage: File | null;
  currentLayerNumber: number;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  project, 
  currentImage,
  currentLayerNumber 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportAll = () => {
    setIsExporting(true);
    const fileCount = exportProject(project, currentImage);
    
    setTimeout(() => {
      setIsExporting(false);
      setShowMenu(false);
    }, fileCount * 500 + 500);
  };

  const handleExportCurrent = () => {
    if (currentImage) {
      downloadImage(currentImage, `layer_${currentLayerNumber}.png`);
    }
    setShowMenu(false);
  };

  const handleExportOriginal = () => {
    if (project.originalImage) {
      downloadImage(project.originalImage, 'original.png');
    }
    setShowMenu(false);
  };

  // Don't show if no layers processed
  if (project.layers.length === 0 && !currentImage) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && !isExporting && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="p-2 space-y-1">
            <button
              onClick={handleExportAll}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div>
                  <div className="font-semibold">Export All Layers</div>
                  <div className="text-xs text-gray-400">Download all {project.layers.length || currentLayerNumber} layers + original</div>
                </div>
              </div>
            </button>

            {currentImage && (
              <button
                onClick={handleExportCurrent}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Current Layer</div>
                    <div className="text-xs text-gray-400">Layer {currentLayerNumber}</div>
                  </div>
                </div>
              </button>
            )}

            {project.originalImage && (
              <button
                onClick={handleExportOriginal}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-semibold">Original Image</div>
                    <div className="text-xs text-gray-400">Source artwork</div>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="border-t border-gray-700 p-3">
            <div className="text-xs text-gray-400">
              <div className="flex items-center justify-between mb-1">
                <span>Cost estimate:</span>
                <span className="text-green-400 font-semibold">~$2.26</span>
              </div>
              <div className="text-gray-500">Per 3-layer separation</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};