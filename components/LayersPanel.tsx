import React from 'react';
import type { ProjectState } from '../types';

interface LayersPanelProps {
  project: ProjectState;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ project }) => {
  if (project.layers.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
        <h2 className="text-lg font-bold text-indigo-400 mb-3">Approved Layers</h2>
        <p className="text-slate-400 text-sm text-center py-8">
          No layers approved yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-bold text-indigo-400 mb-3">Approved Layers</h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {project.layers.map((layer, index) => (
          <div 
            key={layer.id} 
            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-indigo-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-slate-200">
                Layer {index + 1}
              </h3>
              <span className="text-xs px-2 py-1 bg-green-600/30 text-green-400 rounded-full">
                Approved
              </span>
            </div>
            
            {layer.imageFile && (
              <div className="mb-2">
                <img 
                  src={URL.createObjectURL(layer.imageFile)} 
                  alt={`Layer ${index + 1}`}
                  className="w-full h-24 object-contain bg-slate-950 rounded border border-slate-700"
                />
              </div>
            )}
            
            <p className="text-xs text-slate-400 line-clamp-2">
              {layer.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          Total Layers: {project.layers.length}
        </p>
      </div>
    </div>
  );
};