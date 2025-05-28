
import React, { useState } from 'react';
import { Key, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const SettingsPanel = ({ apiKey, setApiKey }: SettingsPanelProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleSaveApiKey = async () => {
    if (!tempApiKey.trim()) return;
    
    setIsValidating(true);
    setValidationStatus('idle');
    
    // Simulate API key validation
    setTimeout(() => {
      const isValid = tempApiKey.startsWith('sk-') && tempApiKey.length > 20;
      setValidationStatus(isValid ? 'valid' : 'invalid');
      setIsValidating(false);
      
      if (isValid) {
        setApiKey(tempApiKey);
      }
    }, 2000);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setTempApiKey('');
    setValidationStatus('idle');
  };

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
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
          Settings & Configuration
        </h1>
        <p className="text-gray-300">Configure your AI assistant and security preferences</p>
      </div>

      <div className="space-y-8">
        {/* API Key Configuration */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 rounded-3xl blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl">
                <Key className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">OpenAI API Configuration</h2>
                <p className="text-gray-300">Connect your OpenAI API key to enable AI-powered analysis</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400 pr-20 focus:border-blue-400 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  
                  {validationStatus === 'valid' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400" />
                  )}
                  {validationStatus === 'invalid' && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400" />
                  )}
                </div>
                
                {validationStatus === 'invalid' && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Invalid API key format. Please check your key and try again.
                  </p>
                )}
                {validationStatus === 'valid' && (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    API key validated successfully!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!tempApiKey.trim() || isValidating}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                >
                  {isValidating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Validating...
                    </div>
                  ) : (
                    'Save & Validate'
                  )}
                </Button>
                
                {apiKey && (
                  <Button
                    onClick={handleClearApiKey}
                    variant="outline"
                    className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/40"
                  >
                    Clear Key
                  </Button>
                )}
              </div>

              {/* Help Section */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    How to get your OpenAI API Key
                  </h3>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <p>1. Visit <span className="text-blue-400 font-mono">platform.openai.com</span></p>
                    <p>2. Sign in to your OpenAI account</p>
                    <p>3. Navigate to "API Keys" in your account settings</p>
                    <p>4. Click "Create new secret key"</p>
                    <p>5. Copy the key and paste it above</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-600/5 rounded-3xl blur-2xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-600/20 rounded-xl">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Security & Privacy</h2>
                <p className="text-gray-300">Your data security is our priority</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Local Processing</h4>
                    <p className="text-gray-300 text-sm">Your API key is stored locally in your browser session</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">No Data Storage</h4>
                    <p className="text-gray-300 text-sm">We don't store your AWS bills or API keys on our servers</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Encrypted Transit</h4>
                    <p className="text-gray-300 text-sm">All communications use HTTPS encryption</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Session Only</h4>
                    <p className="text-gray-300 text-sm">Data is cleared when you close the browser</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {apiKey && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-600/5 rounded-2xl blur-xl"></div>
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">API Connected</h3>
                  <p className="text-gray-300 text-sm">
                    Your AI assistant is ready to analyze your AWS bills
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
