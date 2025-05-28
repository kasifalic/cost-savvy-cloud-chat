
import React, { useState } from 'react';
import { Cloud, BarChart3, MessageSquare, Settings, Sparkles, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'chat' | 'settings';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'chat' | 'settings') => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'upload', label: 'Upload', icon: Cloud },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-orange-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-teal-500 to-orange-600 p-3 rounded-xl">
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
          
          {/* Desktop Navigation */}
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
                        ? 'text-white bg-gradient-to-r from-teal-500/20 to-orange-600/20 shadow-lg border border-white/20'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-orange-600/10 rounded-xl blur-xl"></div>
                    )}
                    <Icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/5 backdrop-blur-xl border-b border-white/10">
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        activeTab === item.id
                          ? 'text-white bg-gradient-to-r from-teal-500/20 to-orange-600/20 border border-white/20'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
