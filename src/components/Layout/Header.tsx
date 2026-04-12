import React from 'react';
import { churchConfig } from '@services/config';

interface HeaderProps {
  onStatusChange?: (status: string) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">{churchConfig.name}</h1>
            <p className="text-blue-100 mt-1">{churchConfig.description}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold">En Vivo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
