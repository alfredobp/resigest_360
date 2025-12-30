"use client";
import dynamic from 'next/dynamic';

// Dynamically import IFCViewer component with no SSR
const IFCViewer = dynamic(() => import('./IFCViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 rounded-full border-t-brand-500 animate-spin"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando visor BIM...</p>
      </div>
    </div>
  ),
});

export default IFCViewer;
