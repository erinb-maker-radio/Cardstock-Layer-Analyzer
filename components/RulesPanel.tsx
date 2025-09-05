import React, { useState } from 'react';

const RuleItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <li>
    <p><strong className="font-semibold text-indigo-400">{title}:</strong> {children}</p>
  </li>
);

export const RulesPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-6 text-left"
        aria-expanded={isOpen}
        aria-controls="rules-content"
      >
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Analysis Rules & Procedures
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div id="rules-content" className="px-4 md:px-6 pb-6 space-y-4 text-slate-300 text-sm animate-fade-in">
          <div>
            <h3 className="font-bold text-slate-200 mb-2">1. The "Conceptual Component" Rule</h3>
            <p>A layer is a single conceptual component of the artwork. This component is a set of shapes that would be cut from the same single sheet of cardstock.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-200 mb-2">2. Composition of a Layer</h3>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>A component is defined by its fill (a single solid color or a single continuous gradient).</li>
              <li>A component CAN consist of several physically separate parts IF they logically belong together (e.g., the two eyes and nose of a face).</li>
              <li>A component MUST NOT include unrelated elements just because they share the same color.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 mb-2">3. Explicit Exclusions (What is NOT a layer)</h3>
            <p>The analysis MUST exclude elements that are clearly stylistic additions and not physical pieces of cardstock. This includes:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 mt-2">
                <li>Shadows cast by other objects.</li>
                <li>Thin outlines that border a different colored shape.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 mb-2">4. Layer Identification</h3>
             <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Layer 1 is the most <strong>foreground</strong> conceptual component.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};