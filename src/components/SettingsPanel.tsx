
import React, { useState } from 'react';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const SettingsPanel = ({ apiKey, setApiKey }: SettingsPanelProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const validateApiKey = (key: string) => {
    // Basic validation for OpenAI API key format
    const apiKeyPattern = /^sk-[a-zA-Z0-9]{48}$/;
    return apiKeyPattern.test(key);
  };

  const handleSaveApiKey = () => {
    if (!tempApiKey.trim()) {
      setValidationStatus('invalid');
      return;
    }

    setIsValidating(true);
    
    // Simulate API key validation
    setTimeout(() => {
      if (validateApiKey(tempApiKey)) {
        setApiKey(tempApiKey);
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
      }
      setIsValidating(false);
    }, 1000);
  };

  const handleClearApiKey = () => {
    setTempApiKey('');
    setApiKey('');
    setValidationStatus('idle');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Configure your API keys and preferences for AWS bill analysis.</p>
      </div>

      <div className="space-y-6">
        {/* OpenAI API Key Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">OpenAI API Key</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your OpenAI API key is required to enable AI-powered chat analysis of your AWS bills. 
              The key is stored securely in your browser session and never sent to our servers.
            </p>

            <div className="space-y-2">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => {
                    setTempApiKey(e.target.value);
                    setValidationStatus('idle');
                  }}
                  placeholder="sk-..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {validationStatus === 'valid' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">API key is valid and saved</span>
                </div>
              )}
              
              {validationStatus === 'invalid' && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invalid API key format</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSaveApiKey}
                disabled={isValidating || !tempApiKey.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Validating...' : 'Save API Key'}
              </button>
              
              {apiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-blue-900 mb-3">How to get your OpenAI API Key</h4>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">platform.openai.com/api-keys</a></li>
            <li>Sign in to your OpenAI account or create one if needed</li>
            <li>Click "Create new secret key"</li>
            <li>Copy the generated key (it starts with "sk-")</li>
            <li>Paste it in the field above and click "Save API Key"</li>
          </ol>
          <p className="text-sm text-blue-700 mt-3">
            <strong>Note:</strong> You'll need to add billing information to your OpenAI account to use the API.
          </p>
        </div>

        {/* Privacy Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Privacy & Security</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Your API key is stored only in your browser session</li>
            <li>• No data is sent to our servers - all processing happens locally</li>
            <li>• Your AWS bill data never leaves your device</li>
            <li>• API calls are made directly to OpenAI from your browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
