
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, BarChart3, MessageSquare, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../integrations/supabase/client';

interface UploadSectionProps {
  onDataExtracted: (data: any) => void;
}

const UploadSection = ({ onDataExtracted }: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingMethod, setProcessingMethod] = useState<'text' | 'vision'>('vision');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert file to base64 safely
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type);
      setUploadStatus('error');
      setErrorMessage('Please upload a PDF file');
      return;
    }

    // Validate file size (15MB limit for Vision processing)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      setUploadStatus('error');
      setErrorMessage('File size must be less than 15MB for GPT-4 Vision processing');
      return;
    }

    // Set processing state
    setIsProcessing(true);
    setUploadStatus('idle');
    setErrorMessage('');
    
    try {
      console.log('Converting file to base64 using FileReader...');
      
      // Convert file to base64 using FileReader (safe for large files)
      const base64String = await fileToBase64(file);
      
      console.log('File converted to base64, length:', base64String.length);
      console.log(`Calling Supabase function with ${processingMethod} method...`);

      // Choose function based on processing method
      const functionName = processingMethod === 'vision' ? 'parse-aws-invoice-vision' : 'parse-aws-invoice';

      // Call the parse function
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: {
          fileData: base64String,
          fileName: file.name
        }
      });

      console.log('Supabase function response:', { result, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to process invoice: ${error.message}`);
      }

      if (result?.error) {
        console.error('Function returned error:', result.error);
        throw new Error(result.error);
      }

      if (!result?.success || !result?.data) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response from processing function');
      }

      console.log('Processing successful, extracted data:', result.data);
      
      // Success
      setIsProcessing(false);
      setUploadStatus('success');
      onDataExtracted(result.data);

    } catch (error: any) {
      console.error('Error during file processing:', error);
      setIsProcessing(false);
      setUploadStatus('error');
      setErrorMessage(error.message || 'An error occurred while processing the file');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-teal-500/10 to-orange-600/10 backdrop-blur-xl border border-white/20 p-6 rounded-full">
            <FileText className="h-12 w-12 text-teal-400" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
          Analyze Your AWS Bill
        </h1>
        <p className="text-xl text-black max-w-2xl mx-auto leading-relaxed">
          Upload your AWS billing PDF and get AI-powered insights with GPT-4 Vision for accurate cost analysis
        </p>
      </div>

      {/* Processing Method Selection */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            Choose Processing Method
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setProcessingMethod('vision')}
              className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
                processingMethod === 'vision'
                  ? 'bg-gradient-to-r from-teal-500/20 to-orange-600/20 border-teal-500/50 text-teal-400'
                  : 'bg-white/5 border-white/20 text-black hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">GPT-4 Vision (Recommended)</div>
                  <div className="text-sm opacity-70">AI analyzes PDF as images for maximum accuracy</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setProcessingMethod('text')}
              className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
                processingMethod === 'text'
                  ? 'bg-gradient-to-r from-teal-500/20 to-orange-600/20 border-teal-500/50 text-teal-400'
                  : 'bg-white/5 border-white/20 text-black hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Text Extraction</div>
                  <div className="text-sm opacity-70">Extract text directly from PDF</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-3xl blur-3xl"></div>
        <div
          className={`relative backdrop-blur-xl bg-white/5 border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
            isDragging 
              ? 'border-teal-400 bg-teal-500/10 scale-105 shadow-2xl shadow-teal-500/20' 
              : 'border-white/20 hover:border-white/40 hover:bg-white/10'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-orange-600 rounded-full blur-lg opacity-50 animate-spin"></div>
                <div className="relative bg-gradient-to-r from-teal-500/20 to-orange-600/20 p-4 rounded-full inline-block">
                  {processingMethod === 'vision' ? (
                    <Eye className="h-8 w-8 text-teal-400 animate-pulse" />
                  ) : (
                    <Sparkles className="h-8 w-8 text-teal-400 animate-pulse" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  {processingMethod === 'vision' ? 'GPT-4 Vision Processing...' : 'AI Processing Your Bill...'}
                </h3>
                <p className="text-black">
                  {processingMethod === 'vision' 
                    ? 'Converting PDF to images and analyzing with AI vision...'
                    : 'Extracting text and analyzing with AI...'
                  }
                </p>
                <div className="mt-4 w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-orange-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-50"></div>
                <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto relative" />
              </div>
              <h3 className="text-2xl font-semibold text-black">Upload Successful!</h3>
              <p className="text-black">
                Your AWS bill has been analyzed with {processingMethod === 'vision' ? 'GPT-4 Vision' : 'AI text extraction'}. 
                Check the dashboard for insights.
              </p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-4">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
              <h3 className="text-2xl font-semibold text-black">Upload Failed</h3>
              <p className="text-black">{errorMessage}</p>
              <Button 
                onClick={() => setUploadStatus('idle')}
                className="relative bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-6 py-2 text-sm font-medium border-0"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-orange-600/20 rounded-full blur-xl"></div>
                <Upload className="h-16 w-16 text-teal-400 mx-auto relative" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-black mb-2">Drop your AWS bill here</h3>
                <p className="text-black mb-6">or click to browse files</p>
                <div className="space-y-2 text-sm text-black">
                  <p>• Supports PDF files only</p>
                  <p>• Maximum file size: {processingMethod === 'vision' ? '15MB' : '10MB'}</p>
                  <p>• {processingMethod === 'vision' ? 'GPT-4 Vision' : 'AI text'} powered analysis</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button 
                  onClick={handleButtonClick}
                  className="relative bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-medium border-0 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300"
                >
                  Choose File
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        {[
          {
            icon: Eye,
            title: 'GPT-4 Vision Analysis',
            description: 'AI visually analyzes your AWS PDFs with advanced computer vision for maximum accuracy'
          },
          {
            icon: BarChart3,
            title: 'Real Cost Analytics',
            description: 'Get detailed breakdowns with actual data from your AWS billing documents'
          },
          {
            icon: MessageSquare,
            title: 'Smart AI Assistant',
            description: 'Ask questions about your specific bill and get personalized recommendations'
          }
        ].map((feature, index) => (
          <div key={index} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group-hover:border-white/20">
              <feature.icon className="h-8 w-8 text-teal-400 mb-4" />
              <h4 className="text-lg font-semibold text-black mb-2">{feature.title}</h4>
              <p className="text-black text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadSection;
