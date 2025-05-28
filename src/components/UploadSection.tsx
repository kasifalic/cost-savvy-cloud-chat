
import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, BarChart3, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';

interface UploadSectionProps {
  onDataExtracted: (data: any) => void;
}

const UploadSection = ({ onDataExtracted }: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    const pdfFile = files.find(file => file.type === 'application/pdf');
    if (!pdfFile) {
      setUploadStatus('error');
      return;
    }

    setIsProcessing(true);
    setUploadStatus('idle');
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setUploadStatus('success');
      onDataExtracted({
        totalCost: 2847.56,
        services: ['EC2', 'S3', 'RDS', 'Lambda'],
        period: 'March 2024'
      });
    }, 3000);
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
          Upload your AWS billing PDF and get AI-powered insights, cost optimization recommendations, and detailed analysis
        </p>
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
                  <Sparkles className="h-8 w-8 text-teal-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">Processing Your Bill</h3>
                <p className="text-black">AI is analyzing your AWS costs...</p>
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
              <p className="text-black">Your AWS bill has been analyzed. Check the dashboard for insights.</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-4">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
              <h3 className="text-2xl font-semibold text-black">Upload Failed</h3>
              <p className="text-black">Please ensure you're uploading a valid PDF file.</p>
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
                  <p>• Maximum file size: 10MB</p>
                  <p>• Your data is processed securely</p>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="relative bg-gradient-to-r from-teal-500 to-orange-600 hover:from-teal-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-medium cursor-pointer border-0 shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300">
                    Choose File
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        {[
          {
            icon: BarChart3,
            title: 'Cost Analytics',
            description: 'Detailed breakdown of your AWS spending with interactive charts'
          },
          {
            icon: MessageSquare,
            title: 'AI Assistant',
            description: 'Ask questions about your bill and get intelligent recommendations'
          },
          {
            icon: Sparkles,
            title: 'Optimization',
            description: 'AI-powered suggestions to reduce your AWS costs'
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
