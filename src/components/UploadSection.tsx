
import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadSectionProps {
  onDataExtracted: (data: any) => void;
}

const UploadSection = ({ onDataExtracted }: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (!pdfFile) {
      setUploadStatus('error');
      return;
    }

    setFileName(pdfFile.name);
    setUploadStatus('processing');

    // Simulate PDF processing
    setTimeout(() => {
      const mockData = {
        totalCost: 1247.83,
        billingPeriod: '2024-05-01 to 2024-05-31',
        services: [
          { name: 'EC2-Instance', cost: 456.32, percentage: 36.6 },
          { name: 'S3', cost: 234.21, percentage: 18.8 },
          { name: 'RDS', cost: 187.45, percentage: 15.0 },
          { name: 'CloudFront', cost: 123.67, percentage: 9.9 },
          { name: 'Lambda', cost: 89.12, percentage: 7.1 },
          { name: 'Other Services', cost: 157.06, percentage: 12.6 },
        ],
        trends: [
          { month: 'Jan', cost: 1156.23 },
          { month: 'Feb', cost: 1089.45 },
          { month: 'Mar', cost: 1198.67 },
          { month: 'Apr', cost: 1134.56 },
          { month: 'May', cost: 1247.83 },
        ]
      };
      
      onDataExtracted(mockData);
      setUploadStatus('success');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Analyze Your AWS Bills with AI
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Upload your AWS PDF bill and get instant insights, cost breakdowns, and optimization recommendations
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : uploadStatus === 'success'
            ? 'border-green-400 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus === 'processing'}
        />

        <div className="flex flex-col items-center space-y-4">
          {uploadStatus === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-lg font-medium text-blue-600">Processing your AWS bill...</p>
              <p className="text-sm text-gray-500">Extracting cost data and analyzing services</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-lg font-medium text-green-600">Successfully processed!</p>
              <p className="text-sm text-gray-500">{fileName}</p>
              <button
                onClick={() => {
                  setUploadStatus('idle');
                  setFileName('');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Upload another bill
              </button>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-600" />
              <p className="text-lg font-medium text-red-600">Upload failed</p>
              <p className="text-sm text-gray-500">Please upload a valid PDF file</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">
                Drop your AWS bill PDF here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <FileText className="h-4 w-4" />
                <span>PDF files only • Max 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadStatus === 'success' && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Your bill has been processed! Navigate to the Dashboard to see your cost analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
