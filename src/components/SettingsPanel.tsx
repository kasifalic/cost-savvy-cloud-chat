
import React from 'react';
import { Shield, CheckCircle, Lock, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const SettingsPanel = ({ apiKey, setApiKey }: SettingsPanelProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-600/10 backdrop-blur-xl border border-white/20 p-6 rounded-full">
            <Lock className="h-12 w-12 text-purple-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Settings & Configuration
        </h1>
        <p className="text-black">Configure your preferences and view security information</p>
      </div>

      <div className="space-y-8">
        {/* Security & Privacy */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-600/5 rounded-3xl blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-600/20 rounded-xl">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Security & Privacy</h2>
                <p className="text-black">Your data security is our priority</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Local Processing</h4>
                    <p className="text-black text-sm">Your data is processed locally in your browser session</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">No Data Storage</h4>
                    <p className="text-black text-sm">We don't store your AWS bills on our servers</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Encrypted Transit</h4>
                    <p className="text-black text-sm">All communications use HTTPS encryption</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Session Only</h4>
                    <p className="text-black text-sm">Data is cleared when you close the browser</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 rounded-3xl blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">AI Features</h2>
                <p className="text-black">Intelligent analysis powered by advanced AI</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Cost Analysis</h4>
                    <p className="text-black text-sm">AI-powered insights into your AWS spending patterns</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Smart Recommendations</h4>
                    <p className="text-black text-sm">Get personalized cost optimization suggestions</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Interactive Chat</h4>
                    <p className="text-black text-sm">Ask questions about your bill and get instant answers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">Real-time Processing</h4>
                    <p className="text-black text-sm">Fast analysis with immediate results</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
