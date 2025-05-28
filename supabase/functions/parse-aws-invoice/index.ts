
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Function to extract text from PDF using multiple methods
async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    console.log('Attempting to extract text from PDF...');
    
    // Method 1: Try PDF.co API
    try {
      console.log('Trying PDF.co API...');
      const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo'
        },
        body: JSON.stringify({
          file: `data:application/pdf;base64,${base64Data}`,
          pages: "1-5",
          async: false
        })
      });

      if (pdfCoResponse.ok) {
        const pdfCoData = await pdfCoResponse.json();
        if (pdfCoData.body && pdfCoData.body.length > 100) {
          console.log('PDF.co extraction successful, text length:', pdfCoData.body.length);
          return cleanExtractedText(pdfCoData.body);
        }
      }
    } catch (error) {
      console.log('PDF.co failed:', error.message);
    }

    // Method 2: Enhanced fallback extraction
    console.log('Using enhanced fallback extraction...');
    return await enhancedFallbackExtraction(base64Data);
    
  } catch (error) {
    console.error('All PDF extraction methods failed:', error);
    throw new Error('Unable to extract text from PDF. Please ensure the file is a valid AWS billing PDF.');
  }
}

// Enhanced fallback method to extract text from PDF
async function enhancedFallbackExtraction(base64Data: string): Promise<string> {
  try {
    // Convert base64 to binary and look for text patterns
    const pdfContent = atob(base64Data);
    console.log('PDF content length:', pdfContent.length);
    
    // Extract text objects and streams from PDF
    const textPatterns = [
      /\(([^)]+)\)/g,  // Text in parentheses
      /\[([^\]]+)\]/g,  // Text in brackets
      /BT\s+([^ET]+)\s+ET/g,  // Text between BT and ET markers
      /Tj\s*$/gm,      // Text show operators
      /TJ\s*$/gm,      // Text show with spacing
    ];
    
    let extractedText = '';
    
    // Try to find readable text using various patterns
    for (const pattern of textPatterns) {
      const matches = pdfContent.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean up the match and extract readable characters
          const cleaned = match
            .replace(/[^\x20-\x7E]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleaned.length > 3) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }
    
    // If that didn't work well, try a more aggressive approach
    if (extractedText.length < 500) {
      console.log('Trying more aggressive text extraction...');
      
      // Look for common AWS billing terms and extract surrounding text
      const awsTerms = ['AWS', 'Amazon', 'Total', 'USD', '$', 'Invoice', 'Bill', 'EC2', 'S3', 'RDS', 'Lambda'];
      const chunks = pdfContent.split(/[\x00-\x1F]+/); // Split on control characters
      
      for (const chunk of chunks) {
        const readableChunk = chunk.replace(/[^\x20-\x7E]/g, ' ').trim();
        if (readableChunk.length > 10) {
          // Check if chunk contains AWS-related terms
          const hasAwsTerm = awsTerms.some(term => 
            readableChunk.toLowerCase().includes(term.toLowerCase())
          );
          
          if (hasAwsTerm) {
            extractedText += readableChunk + ' ';
          }
        }
      }
    }
    
    const finalText = cleanExtractedText(extractedText);
    console.log('Fallback extraction completed, final text length:', finalText.length);
    
    if (finalText.length < 100) {
      throw new Error('Insufficient text extracted from PDF');
    }
    
    return finalText;
    
  } catch (error) {
    console.error('Enhanced fallback extraction failed:', error);
    throw new Error('Could not extract readable text from PDF');
  }
}

// Clean and prepare extracted text
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII and newlines
    .trim()
    .substring(0, 20000); // Limit to 20KB to stay within token limits
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

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileData, fileName } = requestBody;
    
    console.log('Received file:', fileName);
    console.log('File data length:', fileData?.length || 0);
    
    if (!fileData || !fileName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing file data or filename' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract text from PDF
    let extractedText;
    try {
      extractedText = await extractTextFromPDF(fileData);
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to extract text from PDF: ${extractionError.message}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Could not extract sufficient readable text from PDF. Please ensure the PDF contains AWS billing information and is not password protected.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully extracted text, length:', extractedText.length);
    console.log('Sample text:', extractedText.substring(0, 200));

    // Call OpenAI API for structured data extraction
    console.log('Calling OpenAI API...');

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
            content: `You are an expert at extracting structured data from AWS billing documents. You will receive text extracted from an AWS PDF invoice.

            Extract the following information and return ONLY a valid JSON object (no markdown, no code blocks):

            {
              "totalCost": number (the total amount due - look for words like "Total", "Amount Due", "Balance", followed by a dollar amount),
              "costChange": number (percentage change from previous period if mentioned, otherwise 0),
              "billingPeriod": "YYYY-MM" (billing period from the document),
              "services": [
                {
                  "name": "service name",
                  "cost": number,
                  "change": number (percentage change if available, otherwise 0),
                  "description": "brief description"
                }
              ],
              "recommendations": [
                "cost optimization recommendation based on the services used"
              ]
            }

            CRITICAL RULES:
            - Return ONLY the JSON object, no additional text
            - Extract exact numerical values from the text
            - If you cannot find a total cost, look for any dollar amounts and use the largest one
            - Focus on finding AWS service names like EC2, S3, RDS, Lambda, CloudFront, etc.
            - If no clear data is found, return reasonable defaults but ensure totalCost is a valid number`
          },
          {
            role: 'user',
            content: `Extract AWS billing data from this text. The filename is "${fileName}".

TEXT FROM PDF:
${extractedText}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    console.log('OpenAI response status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false,
        error: `OpenAI API error: ${openAIResponse.status}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received');
    
    if (!openAIData.choices || !openAIData.choices[0]) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid response from OpenAI' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let extractedContent = openAIData.choices[0].message.content;
    console.log('Raw OpenAI response:', extractedContent);
    
    // Clean up the response
    extractedContent = extractedContent.trim();
    if (extractedContent.startsWith('```json')) {
      extractedContent = extractedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (extractedContent.startsWith('```')) {
      extractedContent = extractedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned content:', extractedContent);
    
    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(extractedContent);
      console.log('Successfully parsed OpenAI response');
      
      // Ensure we have valid data structure
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error('Response is not a valid object');
      }
      
      // Set defaults for missing fields
      parsedData.totalCost = parsedData.totalCost || 0;
      parsedData.costChange = parsedData.costChange || 0;
      parsedData.billingPeriod = parsedData.billingPeriod || new Date().toISOString().substring(0, 7);
      parsedData.services = parsedData.services || [];
      parsedData.recommendations = parsedData.recommendations || [];
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Attempting manual data extraction...');
      
      // Manual extraction as fallback
      const dollarAmounts = extractedText.match(/\$\s*([0-9,]+\.?[0-9]*)/g) || [];
      const amounts = dollarAmounts.map(amount => {
        const num = parseFloat(amount.replace(/[\$,\s]/g, ''));
        return isNaN(num) ? 0 : num;
      });
      
      const totalCost = amounts.length > 0 ? Math.max(...amounts) : 0;
      
      parsedData = {
        totalCost: totalCost,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: totalCost > 0 ? [
          { 
            name: 'AWS Services', 
            cost: totalCost, 
            change: 0, 
            description: 'Various AWS services from uploaded invoice' 
          }
        ] : [],
        recommendations: [
          'Review your AWS usage patterns for optimization opportunities',
          'Consider Reserved Instances for predictable workloads',
          'Monitor and right-size your resources regularly'
        ]
      };
    }

    console.log('Final parsed data:', parsedData);

    return new Response(JSON.stringify({ 
      success: true, 
      data: parsedData 
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
