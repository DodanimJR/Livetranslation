import React from 'react';

interface TabNavigationProps {
  currentTab: 'user' | 'admin';
  onTabChange: (tab: 'user' | 'admin') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'user' as const, label: 'Miembros', icon: '👥' },
    { id: 'admin' as const, label: 'Administrador', icon: '⚙️' },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 font-semibold text-lg transition-all duration-200 flex items-center gap-2 border-b-2 ${
                currentTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
              aria-selected={currentTab === tab.id}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
