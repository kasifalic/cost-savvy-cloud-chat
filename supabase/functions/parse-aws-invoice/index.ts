
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

// Enhanced PDF text extraction with much better binary filtering
async function extractTextFromPDF(base64Data: string): Promise<{ text: string; method: string }> {
  console.log('Starting enhanced PDF text extraction...');
  
  // Method 1: Try PDF.co API first
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
        inline: true,
        extractInvisibleText: false // Don't extract hidden text that might be garbled
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.body && data.body.length > 200) {
        const cleanedText = cleanAndValidateText(data.body);
        if (cleanedText.length > 100) {
          console.log('PDF.co extraction successful, text length:', cleanedText.length);
          return { text: cleanedText, method: 'pdf_co' };
        }
      }
    }
  } catch (error) {
    console.log('PDF.co extraction failed:', error.message);
  }

  // Method 2: Try alternative PDF parsing service
  try {
    console.log('Attempting alternative PDF service...');
    const response = await fetch('https://api.pdflayer.com/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: 'demo', // Demo key - limited usage
        document_url: `data:application/pdf;base64,${base64Data}`,
        output_format: 'txt'
      })
    });

    if (response.ok) {
      const text = await response.text();
      const cleanedText = cleanAndValidateText(text);
      if (cleanedText.length > 100) {
        console.log('Alternative service extraction successful, text length:', cleanedText.length);
        return { text: cleanedText, method: 'pdflayer' };
      }
    }
  } catch (error) {
    console.log('Alternative PDF service failed:', error.message);
  }

  // Method 3: Enhanced manual parsing with much better filtering
  console.log('Using enhanced manual extraction...');
  try {
    const pdfContent = atob(base64Data);
    let extractedText = '';
    
    // Strategy 1: Look for text objects and streams
    const textPatterns = [
      // Text showing operators with better filtering
      /Tj\s*\n?\s*([^)]+)/g,
      /TJ\s*\n?\s*\[([^\]]+)\]/g,
      // Text between parentheses (most common in PDFs)
      /\(([^)]{3,})\)/g,
      // Text after positioning commands
      /\d+\s+\d+\s+Td\s*\(([^)]+)\)/g,
      /\d+\s+TL\s*\(([^)]+)\)/g,
      // Font and text combinations
      /\/F\d+\s+\d+\s+Tf[^)]*\(([^)]{3,})\)/g,
    ];

    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(pdfContent)) !== null) {
        let text = match[1];
        if (text && text.length > 2) {
          // Clean and validate the text
          text = cleanTextContent(text);
          if (isValidText(text)) {
            extractedText += text + ' ';
          }
        }
      }
    }

    // Strategy 2: Look for readable text blocks in streams
    if (extractedText.length < 200) {
      console.log('Trying stream-based extraction...');
      const streamPattern = /stream\s*(.*?)\s*endstream/gs;
      let streamMatch;
      
      while ((streamMatch = streamPattern.exec(pdfContent)) !== null) {
        const streamContent = streamMatch[1];
        // Look for readable text in streams
        const readableChunks = extractReadableFromStream(streamContent);
        extractedText += readableChunks;
      }
    }

    // Strategy 3: Direct text search with aggressive filtering
    if (extractedText.length < 200) {
      console.log('Trying direct text search...');
      // Split by common PDF delimiters and look for readable content
      const chunks = pdfContent.split(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
      
      for (const chunk of chunks) {
        const lines = chunk.split(/[\r\n]+/);
        for (const line of lines) {
          const cleaned = cleanTextContent(line);
          if (isValidBusinessText(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }

    const finalText = cleanAndValidateText(extractedText);
    console.log('Manual extraction completed, text length:', finalText.length);
    
    if (finalText.length < 50) {
      throw new Error('Insufficient readable text extracted from PDF');
    }
    
    return { text: finalText, method: 'enhanced_manual' };
    
  } catch (error) {
    console.error('All extraction methods failed:', error);
    throw new Error('Could not extract readable text from PDF. The PDF may be image-based, encrypted, or heavily encoded.');
  }
}

// Clean and validate text content
function cleanTextContent(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\[nrtbf]/g, ' ') // Replace escape sequences
    .replace(/\\(.)/g, '$1') // Remove escape backslashes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ') // Remove control and high ASCII
    .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII and whitespace
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Check if text is valid and readable
function isValidText(text: string): boolean {
  if (!text || text.length < 3) return false;
  
  // Must contain at least some letters or numbers
  if (!/[a-zA-Z0-9]/.test(text)) return false;
  
  // Reject if too many special characters
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,;:!?()$%-]/g) || []).length / text.length;
  if (specialCharRatio > 0.5) return false;
  
  // Reject PDF-specific binary markers
  const binaryMarkers = ['endstream', 'endobj', 'stream', 'obj', '/Filter', '/Length', 'xref'];
  if (binaryMarkers.some(marker => text.includes(marker))) return false;
  
  return true;
}

// Check if text looks like business/billing content
function isValidBusinessText(text: string): boolean {
  if (!isValidText(text)) return false;
  
  // Look for business/billing related content
  const businessTerms = /\b(AWS|Amazon|EC2|S3|RDS|Lambda|CloudFront|Total|Invoice|Bill|Cost|Service|Usage|Charge|Account|Period|Date|Amount|USD|\$[\d,]+|January|February|March|April|May|June|July|August|September|October|November|December|\d{4}[-\/]\d{1,2}|\d{1,2}[-\/]\d{4})\b/i;
  
  // Prioritize text containing business terms or currency
  if (businessTerms.test(text)) return true;
  
  // Accept general readable text if it's substantial
  return text.length > 10 && /[a-zA-Z]{3,}/.test(text);
}

// Extract readable content from PDF streams
function extractReadableFromStream(streamContent: string): string {
  let readable = '';
  
  // Look for text-like patterns in decoded streams
  const lines = streamContent.split(/[\r\n]+/);
  
  for (const line of lines) {
    const cleaned = cleanTextContent(line);
    
    // Look for lines that might contain meaningful text
    if (cleaned.length > 5 && (
      /\$[\d,]+\.?\d*/.test(cleaned) || // Dollar amounts
      /\b(AWS|Amazon|Total|Invoice|Service|Cost|Usage)\b/i.test(cleaned) || // AWS terms
      /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/.test(cleaned) || // Dates
      /[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}/.test(cleaned) // Proper names
    )) {
      readable += cleaned + ' ';
    }
  }
  
  return readable;
}

// Final cleaning and validation
function cleanAndValidateText(text: string): string {
  const cleaned = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable characters
    .replace(/\b(endstream|endobj|stream|obj|xref|trailer)\b/gi, ' ') // Remove PDF keywords
    .replace(/\/[A-Z][a-zA-Z0-9]*/g, ' ') // Remove PDF commands
    .replace(/\d+\s+0\s+R/g, ' ') // Remove PDF references
    .replace(/<<[^>]*>>/g, ' ') // Remove PDF dictionaries
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
  
  // Return a reasonable amount of text for processing
  return cleaned.substring(0, 15000);
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

    // Step 1: Extract text from PDF with improved filtering
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

    // Step 3: Process with OpenAI with improved prompting
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

            CRITICAL INSTRUCTIONS:
            1. If the text appears to be mostly garbled, binary data, or unreadable, return a response with totalCost: 0 and empty arrays, but include helpful recommendations.
            2. Focus ONLY on clear, readable billing information
            3. Ignore garbled text, special characters, and binary-like content
            4. Look for dollar amounts, service names, dates, and recognizable billing terms

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
                "specific recommendations based on what you can extract"
              ]
            }

            RETURN ONLY THE JSON OBJECT, NO MARKDOWN OR ADDITIONAL TEXT.`
          },
          {
            role: 'user',
            content: `Extract AWS billing data from this text. If the text is mostly unreadable/garbled, set costs to 0 and provide helpful recommendations about PDF quality:

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
        'The PDF text extraction encountered issues. Try uploading a different PDF or check if the PDF is image-based.',
        'Consider using text-based AWS bills rather than scanned images for better accuracy.',
        'You can also try downloading your bill directly from the AWS console for better text extraction.'
      ];
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw OpenAI response:', extractedContent);
      
      // Enhanced fallback for garbled text
      parsedData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'PDF text extraction failed - the file may be image-based or encrypted.',
          'Try uploading a text-based PDF downloaded directly from AWS console.',
          'Consider using AWS Cost Explorer for detailed billing analysis.',
          'Check if the PDF is corrupted or password-protected.'
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
