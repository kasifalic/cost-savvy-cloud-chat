
import React from 'react';
import { FileText, BarChart3, MessageSquare, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from './AuthWrapper';
import { supabase } from '../integrations/supabase/client';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'chat' | 'settings';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'chat' | 'settings') => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: FileText },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'chat' as const, label: 'AI Assistant', icon: MessageSquare },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="relative border-b border-white/10 backdrop-blur-xl bg-white/5">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-xl">
              <FileText className="h-6 w-6 text-teal-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
              AWS Bill Analyzer
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-teal-500/20 to-orange-600/20 text-teal-400 border border-teal-500/30'
                      : 'text-black hover:bg-white/10 hover:text-teal-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-black">
              {user?.email}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-white/20 text-black hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
