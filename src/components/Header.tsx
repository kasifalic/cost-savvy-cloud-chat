
import React from 'react';
import { Cloud, BarChart3, MessageSquare, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'chat' | 'settings';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'chat' | 'settings') => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const navItems = [
    { id: 'upload', label: 'Upload', icon: Cloud },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <Cloud className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AWS Bill Analyzer
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI-Powered Cost Intelligence
              </p>
            </div>
          </div>
          
          <nav className="hidden md:flex">
            <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === item.id
                        ? 'text-white bg-gradient-to-r from-blue-500/20 to-purple-600/20 shadow-lg border border-white/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl blur-xl"></div>
                    )}
                    <Icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-white p-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
