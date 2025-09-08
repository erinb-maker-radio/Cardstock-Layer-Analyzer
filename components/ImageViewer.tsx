import React from 'react';

interface ImageViewerProps {
  imageUrl: string | null;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center justify-center w-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Uploaded concept art"
          className="max-w-full w-full object-contain rounded-md shadow-2xl"
        />
      ) : (
        <div className="text-center text-slate-500 min-h-[300px] lg:min-h-[400px] flex flex-col justify-center items-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
          <p className="mt-4 text-lg font-medium">Your image will be displayed here</p>
          <p className="text-sm">Upload an image to begin the analysis.</p>
        </div>
      )}
    </div>
  );
};