
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

// Enhanced PDF text extraction with better binary filtering
async function extractTextFromPDF(base64Data: string): Promise<{ text: string; method: string }> {
  console.log('Starting enhanced PDF text extraction...');
  
  // Method 1: Try PDF.co API
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
        pages: "1-5", // Focus on first few pages
        async: false,
        inline: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.body && data.body.length > 300) {
        console.log('PDF.co extraction successful, text length:', data.body.length);
        return { text: cleanExtractedText(data.body), method: 'pdf_co' };
      }
    }
  } catch (error) {
    console.log('PDF.co extraction failed:', error.message);
  }

  // Method 2: Improved manual parsing with strict binary filtering
  console.log('Using improved manual extraction...');
  try {
    const pdfContent = atob(base64Data);
    let extractedText = '';
    
    // More aggressive text extraction patterns focusing on readable content
    const textExtractionMethods = [
      // Method 1: Extract text between parentheses (most common in PDFs)
      {
        pattern: /\(([^)]*)\)/g,
        name: 'parentheses'
      },
      // Method 2: Extract text after text positioning commands
      {
        pattern: /Tf\s+([^)]+)\)/g,
        name: 'text_positioning'
      },
      // Method 3: Extract text between BT and ET operators
      {
        pattern: /BT\s+(.*?)\s+ET/gs,
        name: 'text_blocks'
      },
      // Method 4: Extract readable strings after font commands
      {
        pattern: /\/F\d+\s+\d+\s+Tf[^)]*\(([^)]+)\)/g,
        name: 'font_strings'
      }
    ];

    let bestExtraction = { text: '', method: '' };

    for (const method of textExtractionMethods) {
      let methodText = '';
      let match;
      
      while ((match = method.pattern.exec(pdfContent)) !== null) {
        let text = match[1] || match[0];
        
        // Clean and validate the extracted text
        text = text
          .replace(/\\[nrtbf]/g, ' ') // Replace escape sequences
          .replace(/\\(.)/g, '$1') // Remove escape backslashes
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ') // Remove control characters and high ASCII
          .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII and whitespace
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Only include text that looks like actual content
        if (text.length > 2 && /[a-zA-Z0-9]/.test(text) && !isLikelyBinary(text)) {
          methodText += text + ' ';
        }
      }
      
      // Track the best extraction method
      if (methodText.length > bestExtraction.text.length) {
        bestExtraction = { text: methodText, method: method.name };
      }
    }

    // If we still don't have enough text, try a more aggressive approach
    if (bestExtraction.text.length < 500) {
      console.log('Trying aggressive text extraction...');
      
      // Split by PDF delimiters and extract readable chunks
      const chunks = pdfContent.split(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/);
      let aggressiveText = '';
      
      for (const chunk of chunks) {
        const cleaned = chunk
          .replace(/[^\x20-\x7E\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Look for chunks that contain meaningful content
        if (cleaned.length > 8 && (
          /\$[\d,]+\.?\d*/.test(cleaned) || // Dollar amounts
          /\b(AWS|Amazon|EC2|S3|RDS|Lambda|CloudFront|Total|Invoice|Bill|Cost|Service|Usage|Charge)\b/i.test(cleaned) || // AWS terms
          /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(cleaned) || // Months
          /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/.test(cleaned) || // Dates
          /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(cleaned) // Proper nouns
        ) && !isLikelyBinary(cleaned)) {
          aggressiveText += cleaned + ' ';
        }
      }
      
      if (aggressiveText.length > bestExtraction.text.length) {
        bestExtraction = { text: aggressiveText, method: 'aggressive_extraction' };
      }
    }

    const finalText = cleanExtractedText(bestExtraction.text);
    console.log('Manual extraction completed, method:', bestExtraction.method, 'text length:', finalText.length);
    
    if (finalText.length < 100) {
      throw new Error('Insufficient readable text extracted');
    }
    
    return { text: finalText, method: `manual_${bestExtraction.method}` };
    
  } catch (error) {
    console.error('All extraction methods failed:', error);
    throw new Error('Could not extract readable text from PDF. The PDF may be image-based or heavily encoded.');
  }
}

// Check if text is likely binary or encoded content
function isLikelyBinary(text: string): boolean {
  // Check for high ratio of non-printable or control characters
  const nonPrintable = (text.match(/[^\x20-\x7E\s]/g) || []).length;
  const ratio = nonPrintable / text.length;
  
  // Check for PDF-specific binary markers
  const binaryMarkers = [
    'endstream', 'endobj', 'stream', 'obj', '/Filter', '/FlateDecode', 
    '/Length', '/Width', '/Height', '/BitsPerComponent', '/ColorSpace',
    'xref', 'trailer', '%%EOF'
  ];
  
  const hasBinaryMarkers = binaryMarkers.some(marker => text.includes(marker));
  
  // Text is likely binary if it has high non-printable ratio or contains PDF binary markers
  return ratio > 0.3 || hasBinaryMarkers;
}

// Clean and normalize extracted text with better filtering
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable characters
    .replace(/\b(endstream|endobj|stream|obj|xref|trailer)\b/gi, ' ') // Remove PDF keywords
    .replace(/\/[A-Z][a-zA-Z0-9]*/g, ' ') // Remove PDF commands like /Filter
    .replace(/\d+\s+0\s+R/g, ' ') // Remove PDF references like "5 0 R"
    .replace(/<<[^>]*>>/g, ' ') // Remove PDF dictionaries
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim()
    .substring(0, 30000); // Reasonable limit for processing
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
            content: `You are an expert at extracting structured data from AWS billing documents. The text may contain some noise from PDF extraction, so focus on identifying clear billing information.

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
                "cost optimization recommendation based on services used"
              ]
            }

            CRITICAL: Return ONLY the JSON object, no markdown or additional text.
            If you can't find clear total costs, look for any dollar amounts and use the largest one.
            Focus on AWS service names like EC2, S3, RDS, Lambda, CloudFront, etc.
            Ignore PDF noise and binary content - focus only on readable billing information.`
          },
          {
            role: 'user',
            content: `Extract AWS billing data from this PDF text for file "${fileName}". Note that this text was extracted from a PDF and may contain some formatting noise - please focus on the readable billing information:

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
        'Consider Reserved Instances for predictable workloads',
        'Enable detailed billing reports for better cost visibility'
      ];
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw OpenAI response:', extractedContent);
      
      // Enhanced fallback: try to extract basic info from raw text
      const dollarAmounts = extractedText.match(/\$\s*([0-9,]+\.?[0-9]*)/g) || [];
      const amounts = dollarAmounts.map(amount => 
        parseFloat(amount.replace(/[\$,\s]/g, ''))
      ).filter(num => !isNaN(num) && num > 0);
      
      // Try to find billing period
      const monthMatch = extractedText.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
      const dateMatch = extractedText.match(/(\d{4})-(\d{1,2})/);
      
      let billingPeriod = new Date().toISOString().substring(0, 7);
      if (monthMatch) {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = months.indexOf(monthMatch[1].toLowerCase()) + 1;
        billingPeriod = `${monthMatch[2]}-${monthIndex.toString().padStart(2, '0')}`;
      } else if (dateMatch) {
        billingPeriod = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
      }
      
      parsedData = {
        totalCost: amounts.length > 0 ? Math.max(...amounts) : 0,
        costChange: 0,
        billingPeriod: billingPeriod,
        services: [],
        recommendations: [
          'The PDF text extraction had some issues. Please try uploading a clearer PDF or check the extraction history for debugging.',
          'Consider using AWS Cost Explorer for detailed billing analysis'
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
