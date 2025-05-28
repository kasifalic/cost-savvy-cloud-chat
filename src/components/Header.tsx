
import React from 'react';
import { Cloud, BarChart3, MessageSquare, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'chat' | 'settings';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'chat' | 'settings') => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const navItems = [
    { id: 'upload', label: 'Upload Bill', icon: Cloud },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'chat', label: 'Chat Analysis', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">AWS Bill Analyzer</h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
