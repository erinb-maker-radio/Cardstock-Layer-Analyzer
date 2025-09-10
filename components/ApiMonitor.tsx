/**
 * API Monitor Component - Shows real-time status of all API keys
 */
import React, { useState, useEffect } from 'react';
import { apiMonitor, type ApiMonitorState, type ApiKeyStatus } from '../services/apiMonitor';

export function ApiMonitor() {
  const [monitorState, setMonitorState] = useState<ApiMonitorState>(apiMonitor.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Subscribe to monitor updates
    const unsubscribe = apiMonitor.subscribe(setMonitorState);
    
    // Set the currently active key (Key 2 - PAID)
    apiMonitor.setActiveKey('Key 2 (PAID)');
    
    return unsubscribe;
  }, []);

  const handleCheckNow = async () => {
    setIsChecking(true);
    await apiMonitor.checkAllKeys();
    setIsChecking(false);
  };

  const handleToggleMonitoring = () => {
    if (monitorState.isMonitoring) {
      apiMonitor.stopMonitoring();
    } else {
      apiMonitor.startMonitoring();
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'exhausted': return 'text-red-400';
      case 'error': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'available': return '✅';
      case 'exhausted': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const formatTimeRemaining = (resetTime: Date | null): string => {
    if (!resetTime) return '';
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    if (diff <= 0) return 'Ready';
    
    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">API Monitor</h3>
          <div className="flex items-center gap-2">
            {monitorState.keys.map(key => (
              <div
                key={key.keyName}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  key.isActive ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-300'
                }`}
                title={key.keyName}
              >
                {key.isActive && <span className="text-blue-400">●</span>}
                <span>{key.keyPreview}</span>
                <span className={getStatusColor(key.textModelStatus)}>T</span>
                <span className={getStatusColor(key.imageModelStatus)}>I</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckNow}
            disabled={isChecking}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm"
          >
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={monitorState.isMonitoring}
                onChange={handleToggleMonitoring}
                className="rounded"
              />
              Auto-monitor every 5 minutes
            </label>
            <span>Last updated: {monitorState.lastUpdate.toLocaleTimeString()}</span>
          </div>

          <div className="space-y-2">
            {monitorState.keys.map(key => (
              <div
                key={key.keyName}
                className={`p-3 rounded-lg border ${
                  key.isActive 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'bg-gray-700/20 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {key.isActive && <span className="text-blue-400 font-bold">ACTIVE</span>}
                      <span className="font-medium text-white">{key.keyName}</span>
                      <span className="text-gray-400 text-sm font-mono">{key.keyPreview}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Text:</span>
                      <span className={`font-medium ${getStatusColor(key.textModelStatus)}`}>
                        {getStatusIcon(key.textModelStatus)} {key.textModelStatus}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Image:</span>
                      <span className={`font-medium ${getStatusColor(key.imageModelStatus)}`}>
                        {getStatusIcon(key.imageModelStatus)} {key.imageModelStatus}
                      </span>
                      {key.imageModelStatus === 'exhausted' && key.quotaResetTime && (
                        <span className="text-xs text-orange-300 ml-1">
                          ({formatTimeRemaining(key.quotaResetTime)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {key.lastError && (
                  <div className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded">
                    <strong>Last Error:</strong> {key.lastError}
                  </div>
                )}
                
                {key.lastChecked && (
                  <div className="mt-1 text-xs text-gray-400">
                    Last checked: {key.lastChecked.toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
            <strong>Legend:</strong> T = Text API, I = Image API • 
            ✅ Available • ❌ Quota Exhausted • ⚠️ Error • ❓ Unknown
          </div>
        </div>
      )}
    </div>
  );
}