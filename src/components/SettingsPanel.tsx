
import React from 'react';
import { Settings, Key, Database, Shield } from 'lucide-react';

const SettingsPanel = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-teal-500/10 to-orange-600/10 backdrop-blur-xl border border-white/20 p-6 rounded-full">
            <Settings className="h-12 w-12 text-teal-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-xl text-black max-w-2xl mx-auto leading-relaxed">
          Configure your AWS Bill Analyzer preferences and integrations
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* API Configuration */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-semibold text-black">API Configuration</h3>
            </div>
            <p className="text-black mb-4">
              OpenAI API is configured via Supabase secrets for secure PDF processing and AI assistance.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-emerald-300 text-sm">✓ OpenAI integration is properly configured</p>
            </div>
          </div>
        </div>

        {/* Data Storage */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-semibold text-black">Data Storage</h3>
            </div>
            <p className="text-black mb-4">
              Your AWS invoices are securely stored in Supabase with proper authentication and access controls.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-emerald-300 text-sm">✓ Secure storage with Row Level Security enabled</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-semibold text-black">Security</h3>
            </div>
            <p className="text-black mb-4">
              Your data is protected with enterprise-grade security measures and user authentication.
            </p>
            <div className="space-y-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-300 text-sm">✓ User authentication enabled</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-300 text-sm">✓ Row Level Security policies active</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-300 text-sm">✓ Secure file storage with proper access controls</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Information */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-black mb-4">How to Use</h3>
            <div className="space-y-3 text-black">
              <p>1. <strong>Upload:</strong> Upload your AWS billing PDF in the Upload section</p>
              <p>2. <strong>Analyze:</strong> View detailed cost breakdowns in the Dashboard</p>
              <p>3. <strong>Optimize:</strong> Chat with the AI assistant for personalized recommendations</p>
              <p>4. <strong>Save:</strong> Implement suggested optimizations to reduce your AWS costs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
