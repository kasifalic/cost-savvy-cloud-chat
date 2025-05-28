
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, BarChart3, MessageSquare, Eye, X } from 'lucide-react';
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
  const [processingMethod, setProcessingMethod] = useState<'text' | 'vision'>('text');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      handleFileSelection(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(Array.from(files));
    }
  };

  const handleFileSelection = (files: File[]) => {
    // Filter files based on processing method
    let validFiles: File[] = [];
    let invalidFiles: string[] = [];

    files.forEach(file => {
      if (processingMethod === 'vision') {
        // For vision, accept JPG and PNG images
        if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png') {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name} (${file.type})`);
        }
      } else {
        // For text extraction, accept only PDF
        if (file.type === 'application/pdf') {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name} (${file.type})`);
        }
      }
    });

    if (invalidFiles.length > 0) {
      const expectedTypes = processingMethod === 'vision' ? 'JPG, PNG images' : 'PDF files';
      setUploadStatus('error');
      setErrorMessage(`Invalid file types: ${invalidFiles.join(', ')}. Please upload ${expectedTypes} only.`);
      return;
    }

    // Validate file sizes
    const maxSize = 15 * 1024 * 1024; // 15MB
    const oversizedFiles = validFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setUploadStatus('error');
      setErrorMessage(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 15MB per file.`);
      return;
    }

    setSelectedFiles(validFiles);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('error');
      setErrorMessage('Please select files to process');
      return;
    }

    console.log('Processing files:', selectedFiles.map(f => f.name));
    
    setIsProcessing(true);
    setUploadStatus('idle');
    setErrorMessage('');
    
    try {
      let allResults: any[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`Processing file ${i + 1}/${selectedFiles.length}:`, file.name);
        
        const base64String = await fileToBase64(file);
        console.log(`File converted to base64, length:`, base64String.length);

        // Choose function based on processing method
        const functionName = processingMethod === 'vision' ? 'parse-aws-invoice-vision' : 'parse-aws-invoice';

        const { data: result, error } = await supabase.functions.invoke(functionName, {
          body: {
            fileData: base64String,
            fileName: file.name
          }
        });

        console.log(`File ${i + 1} processing result:`, { result, error });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Failed to process ${file.name}: ${error.message}`);
        }

        if (result?.error) {
          console.error('Function returned error:', result.error);
          throw new Error(`Error processing ${file.name}: ${result.error}`);
        }

        if (!result?.success || !result?.data) {
          console.error('Invalid response format:', result);
          throw new Error(`Invalid response from processing ${file.name}`);
        }

        allResults.push({
          fileName: file.name,
          data: result.data,
          extractionId: result.extractionId,
          method: result.method
        });
      }

      console.log('All files processed successfully:', allResults);
      
      // If multiple files, combine the results
      let combinedData;
      if (allResults.length === 1) {
        combinedData = allResults[0].data;
      } else {
        // Combine multiple results
        combinedData = {
          totalCost: allResults.reduce((sum, r) => sum + (r.data.totalCost || 0), 0),
          costChange: allResults.reduce((sum, r) => sum + (r.data.costChange || 0), 0),
          billingPeriod: allResults[0].data.billingPeriod,
          services: allResults.flatMap(r => r.data.services || []),
          recommendations: allResults.flatMap(r => r.data.recommendations || []),
          multipleFiles: allResults.map(r => ({ fileName: r.fileName, data: r.data }))
        };
      }

      setIsProcessing(false);
      setUploadStatus('success');
      setSelectedFiles([]);
      onDataExtracted(combinedData);

    } catch (error: any) {
      console.error('Error during file processing:', error);
      setIsProcessing(false);
      setUploadStatus('error');
      setErrorMessage(error.message || 'An error occurred while processing the files');
    }
  };

  const getAcceptedTypes = () => {
    return processingMethod === 'vision' ? '.jpg,.jpeg,.png' : '.pdf';
  };

  const getFileTypeDescription = () => {
    return processingMethod === 'vision' ? 'JPG, PNG images' : 'PDF files';
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
          Upload your AWS billing documents and get AI-powered insights with advanced analysis
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
              onClick={() => {
                setProcessingMethod('text');
                setSelectedFiles([]);
              }}
              className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
                processingMethod === 'text'
                  ? 'bg-gradient-to-r from-teal-500/20 to-orange-600/20 border-teal-500/50 text-teal-400'
                  : 'bg-white/5 border-white/20 text-black hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Text Extraction (Recommended)</div>
                  <div className="text-sm opacity-70">Extract text directly from PDF files</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setProcessingMethod('vision');
                setSelectedFiles([]);
              }}
              className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
                processingMethod === 'vision'
                  ? 'bg-gradient-to-r from-teal-500/20 to-orange-600/20 border-teal-500/50 text-teal-400'
                  : 'bg-white/5 border-white/20 text-black hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">GPT-4 Vision</div>
                  <div className="text-sm opacity-70">Analyze JPG/PNG images with Vision AI</div>
                </div>
              </div>
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-100/10 border border-blue-200/20 rounded-lg">
            <p className="text-sm text-blue-600">
              <strong>Current method:</strong> {processingMethod === 'vision' ? 'GPT-4 Vision requires JPG/PNG image files' : 'Text Extraction requires PDF files'}
              {processingMethod === 'vision' && ' - You can upload multiple images'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
            <h4 className="text-lg font-semibold text-black mb-3">Selected Files ({selectedFiles.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-teal-400" />
                    <span className="text-sm text-black">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={processFiles}
                className="bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white"
              >
                Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
              </Button>
              <Button 
                onClick={() => setSelectedFiles([])}
                variant="outline"
                className="border-white/20 text-black hover:bg-white/10"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  {processingMethod === 'vision' ? 'Processing with Vision API...' : 'AI Processing Your Files...'}
                </h3>
                <p className="text-black">
                  {processingMethod === 'vision' 
                    ? 'Analyzing images with GPT-4 Vision...'
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
              <h3 className="text-2xl font-semibold text-black">Processing Complete!</h3>
              <p className="text-black">
                Your files have been analyzed with {processingMethod === 'vision' ? 'Vision API' : 'AI text extraction'}. 
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
                <h3 className="text-2xl font-semibold text-black mb-2">
                  Drop your {getFileTypeDescription()} here
                </h3>
                <p className="text-black mb-6">or click to browse files</p>
                <div className="space-y-2 text-sm text-black">
                  <p>• Supports {getFileTypeDescription()}</p>
                  <p>• Maximum file size: 15MB per file</p>
                  <p>• {processingMethod === 'vision' ? 'Multiple images supported' : 'Single or multiple files'}</p>
                  <p>• {processingMethod === 'vision' ? 'Vision AI' : 'AI text'} powered analysis</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptedTypes()}
                  multiple={processingMethod === 'vision'}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button 
                  onClick={handleButtonClick}
                  className="relative bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-medium border-0 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300"
                >
                  Choose {processingMethod === 'vision' ? 'Images' : 'Files'}
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
            icon: processingMethod === 'vision' ? Eye : FileText,
            title: processingMethod === 'vision' ? 'Vision AI Analysis' : 'Smart Text Analysis',
            description: processingMethod === 'vision' 
              ? 'AI analyzes your bill images with GPT-4 Vision for accurate data extraction'
              : 'AI extracts and analyzes text from your AWS PDFs with high accuracy'
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
