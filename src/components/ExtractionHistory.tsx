
import React, { useState, useEffect } from 'react';
import { FileText, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../integrations/supabase/client';

interface Extraction {
  id: string;
  filename: string;
  raw_text: string;
  file_size: number;
  extraction_method: string;
  extracted_at: string;
  processing_status: string;
  processed_data: any;
  processed_at: string;
}

const ExtractionHistory = () => {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtractions();
  }, []);

  const fetchExtractions = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_extractions')
        .select('*')
        .order('extracted_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExtractions(data || []);
    } catch (error) {
      console.error('Error fetching extractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-black mt-2">Loading extraction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">PDF Extraction History</h1>
        <p className="text-black">View and debug PDF text extractions</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Extraction List */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-400" />
              Recent Extractions
            </h2>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {extractions.map((extraction) => (
                  <div
                    key={extraction.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedExtraction?.id === extraction.id
                        ? 'border-teal-400 bg-teal-500/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedExtraction(extraction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-black truncate">
                        {extraction.filename}
                      </span>
                      {getStatusIcon(extraction.processing_status)}
                    </div>
                    
                    <div className="text-sm text-black space-y-1">
                      <p>Method: {extraction.extraction_method}</p>
                      <p>Size: {(extraction.file_size / 1024).toFixed(1)} KB</p>
                      <p>Extracted: {new Date(extraction.extracted_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                
                {extractions.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-black">No extractions found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Extraction Details */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-orange-600/5 rounded-2xl blur-xl"></div>
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            {selectedExtraction ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black">Extraction Details</h2>
                  <Button
                    size="sm"
                    onClick={() => setSelectedExtraction(null)}
                    className="bg-white/10 hover:bg-white/20 text-black border-white/20"
                  >
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-black mb-2">File Info</h3>
                    <div className="bg-white/5 rounded-lg p-3 text-sm text-black">
                      <p><strong>Filename:</strong> {selectedExtraction.filename}</p>
                      <p><strong>Size:</strong> {(selectedExtraction.file_size / 1024).toFixed(1)} KB</p>
                      <p><strong>Method:</strong> {selectedExtraction.extraction_method}</p>
                      <p><strong>Status:</strong> {selectedExtraction.processing_status}</p>
                    </div>
                  </div>
                  
                  {selectedExtraction.processed_data && (
                    <div>
                      <h3 className="font-semibold text-black mb-2">Processed Data</h3>
                      <div className="bg-white/5 rounded-lg p-3">
                        <ScrollArea className="h-32">
                          <pre className="text-xs text-black whitespace-pre-wrap">
                            {JSON.stringify(selectedExtraction.processed_data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-black mb-2">Raw Extracted Text</h3>
                    <div className="bg-white/5 rounded-lg p-3">
                      <ScrollArea className="h-64">
                        <p className="text-xs text-black whitespace-pre-wrap">
                          {selectedExtraction.raw_text}
                        </p>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-black">Select an extraction to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractionHistory;
