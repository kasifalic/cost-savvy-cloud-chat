
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

// Import pdfjs-dist for PDF parsing
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

// PDF text extraction using pdfjs-dist
async function extractTextFromPDF(base64Data: string): Promise<{ text: string; method: string }> {
  console.log('Starting PDF text extraction with pdfjs-dist...');
  
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Loading PDF document...');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      disableFontFace: false,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    let fullText = '';
    
    // Extract text from each page (limit to first 10 pages for performance)
    const maxPages = Math.min(pdf.numPages, 10);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Processing page ${pageNum}...`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      // Clean up page resources
      page.cleanup();
    }
    
    // Clean up PDF resources
    pdf.cleanup();
    
    console.log(`Text extraction completed. Total length: ${fullText.length}`);
    
    if (fullText.length < 50) {
      throw new Error('Insufficient text extracted from PDF');
    }
    
    return { text: fullText.trim(), method: 'pdfjs-dist' };
    
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    
    // Fallback to manual extraction
    console.log('Falling back to manual extraction...');
    return await fallbackManualExtraction(base64Data);
  }
}

// Fallback manual extraction (simplified version of previous method)
async function fallbackManualExtraction(base64Data: string): Promise<{ text: string; method: string }> {
  try {
    const pdfContent = atob(base64Data);
    let extractedText = '';
    
    // Look for text between parentheses (most common in PDFs)
    const textPattern = /\(([^)]{3,})\)/g;
    let match;
    
    while ((match = textPattern.exec(pdfContent)) !== null) {
      let text = match[1];
      if (text && text.length > 2) {
        // Basic cleaning
        text = text
          .replace(/\\[nrtbf]/g, ' ')
          .replace(/\\(.)/g, '$1')
          .replace(/[^\x20-\x7E\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (text.length > 2 && /[a-zA-Z0-9]/.test(text)) {
          extractedText += text + ' ';
        }
      }
    }
    
    if (extractedText.length < 50) {
      throw new Error('Manual extraction also failed to extract sufficient text');
    }
    
    return { text: extractedText.trim(), method: 'manual_fallback' };
    
  } catch (error) {
    console.error('All extraction methods failed:', error);
    throw new Error('Could not extract readable text from PDF. The PDF may be image-based, encrypted, or corrupted.');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parse AWS invoice function called');
    
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
    
    console.log('Processing file:', fileName);
    
    if (!fileData || !fileName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing file data or filename' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Extract text from PDF using pdfjs-dist
    console.log('Extracting text from PDF...');
    const { text: extractedText, method: extractionMethod } = await extractTextFromPDF(fileData);
    
    console.log('Text extracted successfully using method:', extractionMethod);
    console.log('Extracted text sample:', extractedText.substring(0, 500));

    // Step 2: Store raw extraction in Supabase
    console.log('Storing extracted text in Supabase...');
    const { data: extractionRecord, error: dbError } = await supabase
      .from('pdf_extractions')
      .insert({
        filename: fileName,
        raw_text: extractedText,
        file_size: Math.round(fileData.length * 0.75), // Approximate file size from base64
        extraction_method: extractionMethod,
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to store extraction:', dbError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to store extracted data' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Raw extraction stored with ID:', extractionRecord.id);

    // Step 3: Process with OpenAI
    console.log('Processing with OpenAI...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
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
            content: `Extract AWS billing data from this text:

${extractedText}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    let extractedContent = openAIData.choices[0].message.content.trim();
    
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
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw OpenAI response:', extractedContent);
      
      // Fallback data
      parsedData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'AI processing encountered issues. Please check if the PDF contains readable text.',
          'Consider uploading a text-based PDF for better accuracy.',
          'You can download your bill directly from the AWS console for optimal results.'
        ]
      };
    }

    // Step 4: Update the extraction record with processed data
    const { error: updateError } = await supabase
      .from('pdf_extractions')
      .update({
        processed_data: parsedData,
        processing_status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', extractionRecord.id);

    if (updateError) {
      console.error('Failed to update extraction record:', updateError);
    }

    console.log('Processing completed successfully');
    console.log('Final processed data:', parsedData);

    return new Response(JSON.stringify({ 
      success: true, 
      data: parsedData,
      extractionId: extractionRecord.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-aws-invoice function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
