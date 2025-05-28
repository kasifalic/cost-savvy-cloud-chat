
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

import { corsHeaders, handleCorsRequest } from './cors.ts';
import { convertPDFToDataUrl, processImageData } from './pdf-processor.ts';
import { uploadPDFToStorage } from './storage.ts';
import { analyzeWithGPTVision } from './gpt-vision.ts';
import { storeExtractionRecord, updateExtractionRecord } from './database.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Helper function to detect file type from base64 data
function detectFileType(base64Data: string): { type: string; mimeType: string } {
  // Check the first few bytes of the base64 data
  const header = base64Data.substring(0, 10);
  
  // PDF signature
  if (header.startsWith('JVBERi')) {
    return { type: 'pdf', mimeType: 'application/pdf' };
  }
  
  // JPEG signature
  if (header.startsWith('/9j/')) {
    return { type: 'image', mimeType: 'image/jpeg' };
  }
  
  // PNG signature
  if (header.startsWith('iVBORw0K')) {
    return { type: 'image', mimeType: 'image/png' };
  }
  
  // Default to PDF if uncertain
  return { type: 'pdf', mimeType: 'application/pdf' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    console.log('Parse AWS invoice with GPT-4 Vision function called');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { fileData, fileName } = requestBody;
    
    console.log('Processing file with GPT-4 Vision:', fileName);
    
    if (!fileData || !fileName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing file data or filename' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect the file type
    const fileInfo = detectFileType(fileData);
    console.log('Detected file type:', fileInfo);

    // Step 1: Upload file to Supabase Storage
    const storagePath = await uploadPDFToStorage(supabase, fileData, fileName);
    
    // Step 2: Process the file based on its type
    let processedDataUrl = '';
    
    if (fileInfo.type === 'image') {
      console.log('Processing image file for Vision analysis...');
      processedDataUrl = await processImageData(fileData, fileInfo.mimeType);
    } else {
      console.log('Processing PDF file - attempting conversion...');
      processedDataUrl = await convertPDFToDataUrl(fileData);
    }
    
    // Step 3: Store processing record in database
    const extractionRecord = await storeExtractionRecord(
      supabase, 
      fileName, 
      Math.round(fileData.length * 0.75)
    );

    // Step 4: Analyze with GPT-4 Vision
    console.log('Analyzing with GPT-4 Vision...');
    const analyzedData = await analyzeWithGPTVision(processedDataUrl, openAIApiKey);

    // Step 5: Update the extraction record with processed data
    await updateExtractionRecord(supabase, extractionRecord.id, analyzedData);

    console.log('GPT-4 Vision processing completed successfully');
    console.log('Final processed data:', analyzedData);

    return new Response(JSON.stringify({ 
      success: true, 
      data: analyzedData,
      extractionId: extractionRecord.id,
      storagePath: storagePath,
      method: 'gpt4_vision',
      fileType: fileInfo.type,
      processed: processedDataUrl !== ''
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-aws-invoice-vision function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
