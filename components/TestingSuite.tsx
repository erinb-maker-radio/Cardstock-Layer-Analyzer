/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * CRITICAL TESTING COMPONENT: This component validates layer analysis consistency.
 * Success metrics: >90% visual accuracy, single-fill compliance, transparent backgrounds.
 * DO NOT modify success rate calculations or core testing logic without updating guide.
 */
import React, { useState, useCallback } from 'react';
import { analyzeImageLayer, isolateLayer } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface TestResult {
  testNumber: number;
  timestamp: string;
  analysis: {
    description: string;
    reasoning: string;
  };
  isolatedImage: string;
  success: boolean;
  error?: string;
}

interface TestingSuiteProps {
  testImagePath: string;
}

export function TestingSuite({ testImagePath }: TestingSuiteProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const loadTestImage = async (): Promise<{ base64: string; mimeType: string }> => {
    const response = await fetch(testImagePath);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ base64, mimeType: blob.type });
      };
      reader.readAsDataURL(blob);
    });
  };

  const runSingleTest = async (testNumber: number): Promise<TestResult> => {
    const timestamp = new Date().toISOString();
    
    try {
      const imageData = await loadTestImage();
      
      // Run analysis
      const analysisResult = await analyzeImageLayer(imageData.base64, imageData.mimeType);
      
      // Run isolation
      const isolationResult = await isolateLayer(
        imageData.base64, 
        imageData.mimeType, 
        analysisResult.layer_1_description
      );
      
      // Convert isolated image to data URL for display
      const isolatedImageUrl = `data:${isolationResult.mimeType};base64,${isolationResult.base64}`;
      
      return {
        testNumber,
        timestamp,
        analysis: {
          description: analysisResult.layer_1_description,
          reasoning: analysisResult.reasoning
        },
        isolatedImage: isolatedImageUrl,
        success: true
      };
    } catch (error) {
      return {
        testNumber,
        timestamp,
        analysis: {
          description: 'Failed to analyze',
          reasoning: 'Error occurred'
        },
        isolatedImage: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setShowResults(true);
    
    const results: TestResult[] = [];
    
    for (let i = 1; i <= 10; i++) {
      setCurrentTest(i);
      
      // Add delay between tests to avoid rate limiting
      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const result = await runSingleTest(i);
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsRunning(false);
    setCurrentTest(0);
  };

  const analyzeResults = () => {
    const successCount = testResults.filter(r => r.success).length;
    const uniqueDescriptions = new Set(testResults.map(r => r.analysis.description));
    
    return {
      successRate: (successCount / testResults.length) * 100,
      totalTests: testResults.length,
      successCount,
      failureCount: testResults.length - successCount,
      uniqueDescriptions: uniqueDescriptions.size,
      descriptions: Array.from(uniqueDescriptions)
    };
  };

  const stats = testResults.length > 0 ? analyzeResults() : null;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4">Testing Suite</h2>
      
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2">Test Image: {testImagePath}</p>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300"
        >
          {isRunning ? (
            <>
              <LoadingSpinner />
              Running Test {currentTest}/10...
            </>
          ) : (
            'Run 10 Tests'
          )}
        </button>
      </div>

      {stats && (
        <div className="mb-6 p-4 bg-slate-900 rounded-lg">
          <h3 className="text-lg font-bold text-indigo-300 mb-2">Analysis Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Success Rate:</span>
              <span className={`ml-2 font-bold ${stats.successRate >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.successRate.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Successful:</span>
              <span className="ml-2 text-green-400">{stats.successCount}/{stats.totalTests}</span>
            </div>
            <div>
              <span className="text-slate-400">Failed:</span>
              <span className="ml-2 text-red-400">{stats.failureCount}</span>
            </div>
            <div>
              <span className="text-slate-400">Unique Descriptions:</span>
              <span className="ml-2 text-blue-400">{stats.uniqueDescriptions}</span>
            </div>
          </div>
          
          {stats.uniqueDescriptions > 1 && (
            <div className="mt-4">
              <p className="text-sm text-yellow-400 font-semibold">⚠️ Inconsistent Results Detected</p>
              <p className="text-xs text-slate-400 mt-1">
                The model produced {stats.uniqueDescriptions} different layer descriptions across tests.
              </p>
            </div>
          )}
        </div>
      )}

      {showResults && testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-300">Test Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto p-2">
            {testResults.map((result) => (
              <div 
                key={result.testNumber}
                className={`border rounded-lg p-2 ${
                  result.success ? 'border-green-600' : 'border-red-600'
                }`}
              >
                <div className="text-xs font-bold mb-1">
                  Test #{result.testNumber}
                </div>
                {result.success ? (
                  <>
                    <img 
                      src={result.isolatedImage} 
                      alt={`Test ${result.testNumber} result`}
                      className="w-full h-24 object-contain bg-white rounded"
                    />
                    <div className="text-xs text-slate-400 mt-1 truncate" title={result.analysis.description}>
                      {result.analysis.description.substring(0, 50)}...
                    </div>
                  </>
                ) : (
                  <div className="h-24 flex items-center justify-center bg-red-900/20 rounded">
                    <span className="text-xs text-red-400">Failed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {testResults.length > 0 && (
            <div className="mt-4 p-4 bg-slate-900 rounded-lg">
              <h4 className="text-sm font-bold text-indigo-300 mb-2">Detailed Descriptions</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {testResults.map((result) => (
                  <div key={result.testNumber} className="text-xs border-b border-slate-700 pb-2">
                    <span className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                      Test #{result.testNumber}:
                    </span>
                    <p className="text-slate-300 mt-1">{result.analysis.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}