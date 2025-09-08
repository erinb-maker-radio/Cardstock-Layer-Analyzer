import React, { useState } from 'react';
import { TestingSuite } from './components/TestingSuite';
import { Header } from './components/Header';

export default function TestPage() {
  const [testImageFile, setTestImageFile] = useState<File | null>(null);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTestImageFile(file);
      const url = URL.createObjectURL(file);
      setTestImageUrl(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-indigo-400 mb-8">Layer Analysis Testing Suite</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-indigo-300 mb-4">Select Test Image</h2>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-600 file:text-white
                  hover:file:bg-indigo-700"
              />
              
              {testImageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-slate-400 mb-2">Test Image Preview:</p>
                  <img 
                    src={testImageUrl} 
                    alt="Test image" 
                    className="w-full max-w-md rounded-lg border border-slate-600"
                  />
                </div>
              )}
            </div>

            {testImageUrl && (
              <TestingSuite testImagePath={testImageUrl} />
            )}
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-indigo-300 mb-4">Testing Information</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-indigo-400">Purpose:</h3>
                <p>This testing suite runs the layer analysis 10 times on the same image to measure consistency and identify failure patterns.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-indigo-400">What to Look For:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Consistency in layer descriptions</li>
                  <li>Visual accuracy of isolated layers</li>
                  <li>Success/failure rate</li>
                  <li>Common error patterns</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-indigo-400">Expected Result:</h3>
                <p>For the butterfly image, Layer 1 should consistently be identified as all black elements (circle border + butterflies + grass) as a single unified layer.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-indigo-400">Common Issues to Observe:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Missing parts of the black design</li>
                  <li>Including unwanted background elements</li>
                  <li>Fragmenting the design into separate pieces</li>
                  <li>Color/transparency inconsistencies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}