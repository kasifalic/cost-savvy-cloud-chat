
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    // Use more data for better extraction (100KB instead of 50KB)
    const maxDataLength = 100000;
    const truncatedData = fileData.substring(0, maxDataLength);
    
    console.log('Truncated data length:', truncatedData.length);
    console.log('Calling OpenAI API for invoice parsing...');

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
            content: `You are an expert at extracting data from AWS billing invoices. You must extract the EXACT values from the PDF and return ONLY valid JSON without any markdown formatting or code blocks.

            Extract the following information and return it as valid JSON:
            {
              "totalCost": number (the exact total amount due from the invoice),
              "costChange": number (percentage change from previous month if available, otherwise estimate),
              "billingPeriod": "YYYY-MM" (extract from the invoice date),
              "services": [
                {
                  "name": "service name (e.g., EC2-Instance, Amazon S3, Amazon RDS)",
                  "cost": number (exact cost from invoice),
                  "change": number (percentage change if available, otherwise estimate),
                  "description": "brief description of the service"
                }
              ],
              "recommendations": [
                "cost optimization recommendation 1",
                "cost optimization recommendation 2", 
                "cost optimization recommendation 3"
              ]
            }
            
            CRITICAL: Return ONLY the JSON object, no markdown, no code blocks, no additional text. The response must be valid JSON that can be parsed directly.`
          },
          {
            role: 'user',
            content: `Extract the billing data from this AWS invoice PDF. Look for the total amount due, billing period, and service costs. File: ${fileName}. PDF content (base64): ${truncatedData}`
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
      const totalMatch = extractedContent.match(/total[^:]*:\s*(\d+[\d,\.]*)/i);
      const totalCost = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null;
      
      if (totalCost) {
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
        // Last resort fallback
        console.error('Could not extract any meaningful data, using fallback');
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
