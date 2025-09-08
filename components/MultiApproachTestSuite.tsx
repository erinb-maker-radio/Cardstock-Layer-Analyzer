/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * Multi-approach testing suite that compares 5 different layer isolation methods.
 * Tests all approaches simultaneously to determine which produces most consistent single-fill results.
 */

import React, { useState, useCallback } from 'react';
import { analyzeImageLayer } from '../services/geminiService';
import { 
  hybridAIPostProcess, 
  canvasImageDataProcess, 
  opencvIntegration, 
  svgBasedApproach, 
  colorQuantizationProcess 
} from '../services/layerIsolationApproaches';
import { LoadingSpinner } from './LoadingSpinner';

interface ApproachResult {
  approach: string;
  success: boolean;
  image: string;
  singleFillCompliant: boolean;
  error?: string;
  executionTime: number;
}

interface TestResult {
  testNumber: number;
  timestamp: string;
  analysis: {
    description: string;
    reasoning: string;
  };
  approaches: ApproachResult[];
}

interface MultiApproachTestSuiteProps {
  testImagePath: string;
}

export function MultiApproachTestSuite({ testImagePath }: MultiApproachTestSuiteProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const approaches = [
    { name: 'Hybrid AI + Post-Processing', func: hybridAIPostProcess },
    { name: 'Canvas/ImageData Processing', func: canvasImageDataProcess },
    { name: 'OpenCV.js Integration', func: opencvIntegration },
    { name: 'SVG-Based', func: svgBasedApproach },
    { name: 'Color Quantization', func: colorQuantizationProcess }
  ];

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

  const checkSingleFillCompliance = async (base64Image: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const colors = new Set<string>();
        
        // Check all non-transparent pixels
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { // If not transparent
            const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
            colors.add(color);
            
            // Early exit if more than one color found
            if (colors.size > 1) {
              resolve(false);
              return;
            }
          }
        }
        
        // Single fill if 0 or 1 unique colors
        resolve(colors.size <= 1);
      };
      
      img.src = `data:image/png;base64,${base64Image}`;
    });
  };

  const runSingleTest = async (testNumber: number): Promise<TestResult> => {
    const timestamp = new Date().toISOString();
    
    try {
      const imageData = await loadTestImage();
      
      // Run analysis first
      const analysisResult = await analyzeImageLayer(imageData.base64, imageData.mimeType);
      
      // Test all approaches in parallel
      const approachPromises = approaches.map(async (approach) => {
        const startTime = Date.now();
        
        try {
          const result = await approach.func(imageData.base64, imageData.mimeType, analysisResult.layer_1_description);
          const executionTime = Date.now() - startTime;
          
          // Check single fill compliance
          const singleFillCompliant = await checkSingleFillCompliance(result.base64);
          
          return {
            approach: approach.name,
            success: true,
            image: `data:${result.mimeType};base64,${result.base64}`,
            singleFillCompliant,
            executionTime
          } as ApproachResult;
        } catch (error) {
          const executionTime = Date.now() - startTime;
          
          return {
            approach: approach.name,
            success: false,
            image: '',
            singleFillCompliant: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime
          } as ApproachResult;
        }
      });
      
      const approachResults = await Promise.all(approachPromises);
      
      return {
        testNumber,
        timestamp,
        analysis: {
          description: analysisResult.layer_1_description,
          reasoning: analysisResult.reasoning
        },
        approaches: approachResults
      };
    } catch (error) {
      // If analysis fails, return failed test
      return {
        testNumber,
        timestamp,
        analysis: {
          description: 'Failed to analyze',
          reasoning: 'Error occurred'
        },
        approaches: approaches.map(approach => ({
          approach: approach.name,
          success: false,
          image: '',
          singleFillCompliant: false,
          error: 'Analysis failed',
          executionTime: 0
        }))
      };
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setShowResults(true);
    
    const results: TestResult[] = [];
    
    for (let i = 1; i <= 5; i++) {
      setCurrentTest(i);
      
      // Add delay between tests
      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      const result = await runSingleTest(i);
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsRunning(false);
    setCurrentTest(0);
  };

  const analyzeResults = () => {
    if (testResults.length === 0) return null;
    
    const approachStats = approaches.map(approach => {
      const results = testResults.map(test => 
        test.approaches.find(a => a.approach === approach.name)
      ).filter(Boolean);
      
      const successCount = results.filter(r => r.success).length;
      const singleFillCount = results.filter(r => r.singleFillCompliant).length;
      const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      
      return {
        name: approach.name,
        successRate: (successCount / testResults.length) * 100,
        singleFillRate: (singleFillCount / testResults.length) * 100,
        avgExecutionTime: Math.round(avgExecutionTime)
      };
    });
    
    return approachStats.sort((a, b) => b.singleFillRate - a.singleFillRate);
  };

  const stats = analyzeResults();

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4">Multi-Approach Test Suite</h2>
      
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2">Test Image: {testImagePath}</p>
        <p className="text-sm text-slate-400 mb-4">Testing {approaches.length} different layer isolation approaches:</p>
        <ul className="text-xs text-slate-500 mb-4">
          {approaches.map((approach, index) => (
            <li key={index}>• {approach.name}</li>
          ))}
        </ul>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300"
        >
          {isRunning ? (
            <>
              <LoadingSpinner />
              Running Test {currentTest}/5...
            </>
          ) : (
            'Run Approach Comparison (5 tests)'
          )}
        </button>
      </div>

      {stats && (
        <div className="mb-6 p-4 bg-slate-900 rounded-lg">
          <h3 className="text-lg font-bold text-indigo-300 mb-4">Approach Comparison Results</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 text-indigo-300">Approach</th>
                  <th className="text-center py-2 text-green-300">Success Rate</th>
                  <th className="text-center py-2 text-yellow-300">Single Fill Rate</th>
                  <th className="text-center py-2 text-blue-300">Avg Time (ms)</th>
                  <th className="text-center py-2 text-slate-300">Grade</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index} className="border-b border-slate-700">
                    <td className="py-2 font-medium">{stat.name}</td>
                    <td className="text-center py-2">
                      <span className={stat.successRate >= 80 ? 'text-green-400' : 'text-red-400'}>
                        {stat.successRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-center py-2">
                      <span className={stat.singleFillRate >= 90 ? 'text-green-400' : stat.singleFillRate >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                        {stat.singleFillRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-center py-2 text-blue-400">
                      {stat.avgExecutionTime}
                    </td>
                    <td className="text-center py-2">
                      <span className={`font-bold ${
                        stat.singleFillRate >= 90 ? 'text-green-400' : 
                        stat.singleFillRate >= 70 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {stat.singleFillRate >= 90 ? 'A' : 
                         stat.singleFillRate >= 70 ? 'B' : 
                         stat.singleFillRate >= 50 ? 'C' : 'F'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {stats.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded">
              <p className="text-sm font-semibold text-green-400">
                🏆 Best Approach: {stats[0].name} ({stats[0].singleFillRate.toFixed(0)}% single-fill compliance)
              </p>
            </div>
          )}
        </div>
      )}

      {showResults && testResults.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-indigo-300">Detailed Test Results</h3>
          
          {testResults.map((result) => (
            <div key={result.testNumber} className="border border-slate-600 rounded-lg p-4">
              <h4 className="font-bold text-indigo-400 mb-3">Test #{result.testNumber}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                {result.approaches.map((approach) => (
                  <div 
                    key={approach.approach}
                    className={`border rounded-lg p-3 ${
                      approach.singleFillCompliant ? 'border-green-600' : 
                      approach.success ? 'border-yellow-600' : 'border-red-600'
                    }`}
                  >
                    <div className="text-xs font-bold mb-2 truncate" title={approach.approach}>
                      {approach.approach.replace(/^([^\/]+).*/, '$1')}
                    </div>
                    
                    {approach.success ? (
                      <>
                        <img 
                          src={approach.image} 
                          alt={`${approach.approach} result`}
                          className="w-full h-20 object-contain bg-white rounded mb-2"
                        />
                        <div className="flex justify-between items-center text-xs">
                          <span className={approach.singleFillCompliant ? 'text-green-400' : 'text-yellow-400'}>
                            {approach.singleFillCompliant ? '✓ Single' : '⚠ Multi'}
                          </span>
                          <span className="text-blue-400">{approach.executionTime}ms</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-20 flex items-center justify-center bg-red-900/20 rounded text-xs text-red-400">
                        Failed: {approach.error?.substring(0, 30)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-slate-400 p-2 bg-slate-900 rounded">
                <strong>Description:</strong> {result.analysis.description.substring(0, 100)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}