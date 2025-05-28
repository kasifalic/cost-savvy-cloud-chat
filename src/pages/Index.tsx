
import React, { useState } from 'react';
import Header from '../components/Header';
import UploadSection from '../components/UploadSection';
import Dashboard from '../components/Dashboard';
import ChatInterface from '../components/ChatInterface';
import SettingsPanel from '../components/SettingsPanel';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'chat' | 'settings'>('upload');
  const [billData, setBillData] = useState(null);
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'upload' && (
          <UploadSection onDataExtracted={setBillData} />
        )}
        
        {activeTab === 'dashboard' && (
          <Dashboard billData={billData} />
        )}
        
        {activeTab === 'chat' && (
          <ChatInterface billData={billData} apiKey={apiKey} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsPanel apiKey={apiKey} setApiKey={setApiKey} />
        )}
      </main>
    </div>
  );
};

export default Index;
