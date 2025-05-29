
import React, { useState } from 'react';
import Header from '../components/Header';
import UploadSection from '../components/UploadSection';
import Dashboard from '../components/Dashboard';
import ChatInterface from '../components/ChatInterface';
import SettingsPanel from '../components/SettingsPanel';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'chat' | 'settings'>('upload');
  const [billData, setBillData] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 relative overflow-hidden text-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-coral-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="transition-all duration-500 ease-out">
          {activeTab === 'upload' && (
            <div className="animate-fade-in">
              <UploadSection onDataExtracted={setBillData} />
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <Dashboard billData={billData} />
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="animate-fade-in">
              <ChatInterface billData={billData} />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <SettingsPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
