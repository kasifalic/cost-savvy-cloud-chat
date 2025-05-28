
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Function to extract text from PDF using a PDF parsing service
async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    console.log('Extracting text from PDF using PDF parsing service...');
    
    // Use pdf.co API for text extraction (free tier available)
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'demo' // Using demo key for now, can be upgraded
      },
      body: JSON.stringify({
        file: `data:application/pdf;base64,${base64Data}`,
        pages: "1-10", // Extract first 10 pages to avoid too much data
        async: false
      })
    });

    if (!pdfCoResponse.ok) {
      console.log('PDF.co API failed, falling back to alternative method...');
      // Fallback: Try to decode and extract what we can from base64
      return await fallbackTextExtraction(base64Data);
    }

    const pdfCoData = await pdfCoResponse.json();
    console.log('PDF.co response received');
    
    if (pdfCoData.error || !pdfCoData.body) {
      console.log('PDF.co returned error, using fallback...');
      return await fallbackTextExtraction(base64Data);
    }

    const extractedText = pdfCoData.body;
    console.log('Successfully extracted text, length:', extractedText.length);
    
    // Clean and limit the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Limit to 15000 characters to stay within token limits
    const limitedText = cleanedText.substring(0, 15000);
    console.log('Cleaned and limited text length:', limitedText.length);
    
    return limitedText;
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return await fallbackTextExtraction(base64Data);
  }
}

// Fallback method to extract some text indicators from PDF
async function fallbackTextExtraction(base64Data: string): Promise<string> {
  console.log('Using fallback text extraction method...');
  
  try {
    // Convert base64 to text and look for readable content
    const pdfText = atob(base64Data);
    
    // Extract text that looks like it might be from an AWS bill
    const textMatches = pdfText.match(/[\x20-\x7E]{4,}/g) || [];
    const readableText = textMatches
      .filter(text => text.length > 3)
      .join(' ')
      .substring(0, 10000);
    
    console.log('Fallback extraction completed, text length:', readableText.length);
    return readableText || 'Unable to extract readable text from PDF';
    
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return 'PDF text extraction failed';
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
    
    if (!fileData || !fileName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing file data or filename' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File data length:', fileData.length);

    // Extract text from PDF first
    const extractedText = await extractTextFromPDF(fileData);
    
    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Could not extract sufficient text from PDF. Please ensure the PDF contains readable AWS billing information.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling OpenAI API with extracted text...');

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
            content: `You are an expert at extracting data from AWS billing invoices. You will receive extracted text from an AWS PDF invoice and must return ONLY valid JSON without any markdown formatting.

            Extract the following information and return it as valid JSON:
            {
              "totalCost": number (the exact total amount due from the invoice),
              "costChange": number (percentage change from previous month if available, otherwise 0),
              "billingPeriod": "YYYY-MM" (extract from the invoice date),
              "services": [
                {
                  "name": "service name (e.g., EC2-Instance, Amazon S3, Amazon RDS)",
                  "cost": number (exact cost from invoice),
                  "change": number (percentage change if available, otherwise 0),
                  "description": "brief description of the service"
                }
              ],
              "recommendations": [
                "cost optimization recommendation 1",
                "cost optimization recommendation 2", 
                "cost optimization recommendation 3"
              ]
            }
            
            CRITICAL RULES:
            - Return ONLY the JSON object, no markdown, no code blocks, no additional text
            - Extract EXACT values from the text provided
            - If you cannot find exact values, return 0 for numbers and empty arrays for lists
            - Do not guess or hallucinate data that is not clearly present in the text
            - Focus on finding the main total cost and major service breakdowns`
          },
          {
            role: 'user',
            content: `Extract billing data from this AWS invoice text. Find the total amount due, billing period, and service costs. 

            File: ${fileName}
            
            Extracted text from PDF:
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
    console.log('Raw extracted content:', extractedContent);
    
    // Clean up the response - remove markdown code blocks if present
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
      console.log('Successfully parsed OpenAI response:', parsedData);
      
      // Validate that we have the required fields
      if (!parsedData.totalCost || typeof parsedData.totalCost !== 'number') {
        throw new Error('Invalid or missing totalCost in response');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Attempting to extract data manually from raw content...');
      
      // Try to extract at least the total cost manually if JSON parsing fails
      const totalMatches = extractedText.match(/total[^:]*:?\s*\$?\s*([0-9,]+\.?[0-9]*)/gi);
      const amountMatches = extractedText.match(/\$([0-9,]+\.?[0-9]*)/g);
      
      let totalCost = 0;
      if (totalMatches && totalMatches.length > 0) {
        const match = totalMatches[0].match(/([0-9,]+\.?[0-9]*)/);
        if (match) {
          totalCost = parseFloat(match[1].replace(/,/g, ''));
        }
      } else if (amountMatches && amountMatches.length > 0) {
        // Find the largest dollar amount as likely total
        const amounts = amountMatches.map(m => parseFloat(m.replace(/[\$,]/g, '')));
        totalCost = Math.max(...amounts);
      }
      
      if (totalCost > 0) {
        console.log('Extracted total cost manually:', totalCost);
        parsedData = {
          totalCost: totalCost,
          costChange: 0,
          billingPeriod: new Date().toISOString().substring(0, 7),
          services: [
            { name: 'Various AWS Services', cost: totalCost, change: 0, description: 'Multiple AWS services from uploaded invoice' }
          ],
          recommendations: [
            'Review your AWS usage patterns for optimization opportunities',
            'Consider Reserved Instances for predictable workloads',
            'Monitor and right-size your resources'
          ]
        };
      } else {
        console.error('Could not extract any meaningful data');
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Could not extract data from invoice. Please ensure the PDF contains AWS billing information.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Returning parsed data:', parsedData);

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
