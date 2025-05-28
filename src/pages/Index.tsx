
import React, { useState } from 'react';
import UploadSection from '../components/UploadSection';
import Dashboard from '../components/Dashboard';
import ChatInterface from '../components/ChatInterface';
import ExtractionHistory from '../components/ExtractionHistory';

const Index = () => {
  const [billData, setBillData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'chat' | 'history'>('upload');

  const handleDataExtracted = (data: any) => {
    console.log('Data extracted in Index:', data);
    setBillData(data);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white shadow-lg'
                    : 'text-black hover:bg-white/10'
                }`}
              >
                Upload
              </button>
              {billData && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white shadow-lg'
                      : 'text-black hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </button>
              )}
              {billData && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white shadow-lg'
                      : 'text-black hover:bg-white/10'
                  }`}
                >
                  AI Assistant
                </button>
              )}
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-teal-500 to-orange-600 text-white shadow-lg'
                    : 'text-black hover:bg-white/10'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'upload' && (
          <UploadSection onDataExtracted={handleDataExtracted} />
        )}
        
        {activeTab === 'dashboard' && billData && (
          <Dashboard billData={billData} />
        )}
        
        {activeTab === 'chat' && billData && (
          <ChatInterface billData={billData} />
        )}
        
        {activeTab === 'history' && (
          <ExtractionHistory />
        )}
        
        {!billData && (activeTab === 'dashboard' || activeTab === 'chat') && (
          <div className="text-center py-16">
            <p className="text-black text-lg mb-4">Please upload your AWS bill first</p>
            <button
              onClick={() => setActiveTab('upload')}
              className="bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              Go to Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
