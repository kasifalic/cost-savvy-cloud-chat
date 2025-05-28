
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

// Import pdfjs-dist for PDF to image conversion
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Convert PDF pages to images using PDF.js
async function convertPDFToImages(base64Data: string): Promise<string[]> {
  console.log('Converting PDF to images...');
  
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      disableFontFace: false,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    const images: string[] = [];
    
    // Convert first 5 pages to images (limit for cost control)
    const maxPages = Math.min(pdf.numPages, 5);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Converting page ${pageNum} to image...`);
      
      const page = await pdf.getPage(pageNum);
      
      // Set scale for good quality but reasonable size
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      
      // Convert canvas to blob then to base64
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const arrayBuffer = await blob.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      images.push(`data:image/png;base64,${base64Image}`);
      
      // Clean up page resources
      page.cleanup();
    }
    
    // Clean up PDF resources
    pdf.cleanup();
    
    console.log(`Successfully converted ${images.length} pages to images`);
    return images;
    
  } catch (error) {
    console.error('PDF to image conversion failed:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

// Upload PDF to Supabase Storage
async function uploadPDFToStorage(base64Data: string, fileName: string): Promise<string> {
  console.log('Uploading PDF to Supabase Storage...');
  
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('pdf-uploads')
      .upload(uniqueFileName, bytes, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log('PDF uploaded successfully:', data.path);
    return data.path;
    
  } catch (error) {
    console.error('Failed to upload PDF:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}

// Analyze images with GPT-4 Vision
async function analyzeWithGPTVision(images: string[]): Promise<any> {
  console.log(`Analyzing ${images.length} images with GPT-4 Vision...`);
  
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an expert at extracting structured data from AWS billing documents and other cloud service bills.

Extract the following information and return ONLY a valid JSON object:

{
  "totalCost": number (total amount - look for "Total", "Amount Due", "Balance", "Current Charges"),
  "costChange": number (percentage change if mentioned, otherwise 0),
  "billingPeriod": "YYYY-MM" (billing period from document),
  "services": [
    {
      "name": "service name",
      "cost": number,
      "change": number (percentage change if available, otherwise 0),
      "description": "brief description"
    }
  ],
  "recommendations": [
    "specific recommendations based on the billing data"
  ]
}

RETURN ONLY THE JSON OBJECT, NO MARKDOWN OR ADDITIONAL TEXT.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze these AWS billing document pages and extract the structured data:'
          },
          ...images.map(image => ({
            type: 'image_url',
            image_url: {
              url: image,
              detail: 'high'
            }
          }))
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let extractedContent = data.choices[0].message.content.trim();
    
    // Clean up response
    if (extractedContent.startsWith('```json')) {
      extractedContent = extractedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (extractedContent.startsWith('```')) {
      extractedContent = extractedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the structured data
    let parsedData;
    try {
      parsedData = JSON.parse(extractedContent);
      
      // Validate and set defaults
      parsedData.totalCost = parsedData.totalCost || 0;
      parsedData.costChange = parsedData.costChange || 0;
      parsedData.billingPeriod = parsedData.billingPeriod || new Date().toISOString().substring(0, 7);
      parsedData.services = parsedData.services || [];
      parsedData.recommendations = parsedData.recommendations || [
        'Consider analyzing your AWS usage patterns for potential cost optimization.',
        'Review unused or underutilized resources regularly.',
        'Set up billing alerts to monitor cost changes.'
      ];
      
    } catch (parseError) {
      console.error('Failed to parse GPT Vision response:', parseError);
      console.log('Raw GPT Vision response:', extractedContent);
      
      // Fallback data
      parsedData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'GPT Vision analysis encountered issues. Please ensure the PDF contains clear billing information.',
          'Consider uploading a higher quality PDF for better accuracy.',
          'You can download your bill directly from the AWS console for optimal results.'
        ]
      };
    }
    
    return parsedData;
    
  } catch (error) {
    console.error('GPT Vision analysis failed:', error);
    throw new Error(`GPT Vision analysis failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Step 1: Upload PDF to Supabase Storage
    const storagePath = await uploadPDFToStorage(fileData, fileName);
    
    // Step 2: Convert PDF to images
    const images = await convertPDFToImages(fileData);
    
    // Step 3: Store processing record in database
    console.log('Storing processing record in Supabase...');
    const { data: extractionRecord, error: dbError } = await supabase
      .from('pdf_extractions')
      .insert({
        filename: fileName,
        raw_text: `GPT-4 Vision processing of ${images.length} pages`,
        file_size: Math.round(fileData.length * 0.75),
        extraction_method: 'gpt4_vision',
        processing_status: 'processing'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to store extraction record:', dbError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to store processing data' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing record stored with ID:', extractionRecord.id);

    // Step 4: Analyze with GPT-4 Vision
    const analyzedData = await analyzeWithGPTVision(images);

    // Step 5: Update the extraction record with processed data
    const { error: updateError } = await supabase
      .from('pdf_extractions')
      .update({
        processed_data: analyzedData,
        processing_status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', extractionRecord.id);

    if (updateError) {
      console.error('Failed to update extraction record:', updateError);
    }

    console.log('GPT-4 Vision processing completed successfully');
    console.log('Final processed data:', analyzedData);

    return new Response(JSON.stringify({ 
      success: true, 
      data: analyzedData,
      extractionId: extractionRecord.id,
      storagePath: storagePath,
      method: 'gpt4_vision'
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
