
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Enhanced PDF text extraction using multiple methods
async function extractTextFromPDF(base64Data: string): Promise<{ text: string; method: string }> {
  console.log('Starting enhanced PDF text extraction...');
  
  // Method 1: Try PDF.co API (more reliable than before)
  try {
    console.log('Attempting PDF.co extraction...');
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'demo'
      },
      body: JSON.stringify({
        file: `data:application/pdf;base64,${base64Data}`,
        pages: "1-10", // Extract more pages
        async: false,
        inline: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.body && data.body.length > 200) {
        console.log('PDF.co extraction successful, text length:', data.body.length);
        return { text: cleanExtractedText(data.body), method: 'pdf_co' };
      }
    }
  } catch (error) {
    console.log('PDF.co extraction failed:', error.message);
  }

  // Method 2: Enhanced manual parsing with better patterns
  console.log('Using enhanced manual extraction...');
  try {
    const pdfContent = atob(base64Data);
    let extractedText = '';
    
    // Look for text streams and objects in PDF
    const textPatterns = [
      // Text between parentheses (most common)
      /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g,
      // Text in square brackets
      /\[([^\]\\]*(?:\\.[^\]\\]*)*)\]/g,
      // Text between BT and ET operators
      /BT\s+(.*?)\s+ET/gs,
      // Literal strings
      /<([^>]+)>/g,
      // Font and text combinations
      /\/F\d+\s+\d+\s+Tf\s+([^)]+)/g
    ];

    // Extract using multiple patterns
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(pdfContent)) !== null) {
        let text = match[1] || match[0];
        
        // Clean up extracted text
        text = text
          .replace(/\\[nrtbf]/g, ' ') // Replace escape sequences
          .replace(/\\(.)/g, '$1') // Remove escape backslashes
          .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, ' ') // Keep readable characters
          .trim();
        
        if (text.length > 2) {
          extractedText += text + ' ';
        }
      }
    }

    // If still not enough text, try aggressive extraction
    if (extractedText.length < 500) {
      console.log('Trying aggressive text extraction...');
      
      // Split by common PDF delimiters and extract readable chunks
      const chunks = pdfContent.split(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/);
      
      for (const chunk of chunks) {
        const cleaned = chunk
          .replace(/[^\x20-\x7E\u00A0-\u024F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Look for chunks that contain dollar amounts or AWS-related terms
        if (cleaned.length > 5 && (
          /\$[\d,]+\.?\d*/.test(cleaned) ||
          /\b(AWS|Amazon|EC2|S3|RDS|Lambda|CloudFront|Total|Invoice|Bill)\b/i.test(cleaned)
        )) {
          extractedText += cleaned + ' ';
        }
      }
    }

    const finalText = cleanExtractedText(extractedText);
    console.log('Manual extraction completed, text length:', finalText.length);
    
    if (finalText.length < 100) {
      throw new Error('Insufficient text extracted');
    }
    
    return { text: finalText, method: 'manual_enhanced' };
    
  } catch (error) {
    console.error('All extraction methods failed:', error);
    throw new Error('Could not extract readable text from PDF');
  }
}

// Clean and normalize extracted text
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\u00A0-\u024F\n]/g, ' ') // Keep only readable characters
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim()
    .substring(0, 50000); // Increase limit for better context
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

    // Step 1: Extract text from PDF
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
            content: `You are an expert at extracting structured data from AWS billing documents. 

            Extract the following information and return ONLY a valid JSON object:

            {
              "totalCost": number (total amount - look for "Total", "Amount Due", "Balance"),
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
                "cost optimization recommendation based on services used"
              ]
            }

            CRITICAL: Return ONLY the JSON object, no markdown or additional text.
            Extract exact values from the text. If no clear total found, use the largest dollar amount.
            Focus on AWS service names like EC2, S3, RDS, Lambda, etc.`
          },
          {
            role: 'user',
            content: `Extract AWS billing data from this PDF text for file "${fileName}":

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
        'Review your AWS usage patterns for optimization opportunities',
        'Consider Reserved Instances for predictable workloads'
      ];
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      
      // Fallback: extract basic info from raw text
      const dollarAmounts = extractedText.match(/\$\s*([0-9,]+\.?[0-9]*)/g) || [];
      const amounts = dollarAmounts.map(amount => 
        parseFloat(amount.replace(/[\$,\s]/g, ''))
      ).filter(num => !isNaN(num));
      
      parsedData = {
        totalCost: amounts.length > 0 ? Math.max(...amounts) : 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: ['Please review the extracted data and upload a clearer PDF if needed']
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
