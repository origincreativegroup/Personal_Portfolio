import React from 'react';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" aria-hidden />
      <p className="text-sm font-medium">{message ?? 'Loading your workspace...'}</p>
    </div>
  </div>
);

export default LoadingScreen;
