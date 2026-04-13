import React from 'react';
import { churchConfig } from '../../services/config';
import { useTranscriptStore } from '../../context/transcriptStore';

export const Header: React.FC = () => {
  const isLive = useTranscriptStore((s) => s.isLive);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold font-heading truncate">{churchConfig.name}</h1>
            <p className="text-blue-100 text-sm sm:text-base mt-0.5">{churchConfig.description}</p>
          </div>
          {isLive && (
            <div className="flex-shrink-0 inline-flex items-center gap-2 bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold">En Vivo</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
