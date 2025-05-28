
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, billData } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create context from bill data
    let contextData = '';
    if (billData) {
      contextData = `
Current AWS Bill Context:
- Total Cost: $${billData.totalCost || 'N/A'}
- Billing Period: ${billData.billingPeriod || 'N/A'}
- Cost Change: ${billData.costChange ? billData.costChange + '%' : 'N/A'}
- Services: ${billData.services ? billData.services.map((s: any) => `${s.name}: $${s.cost}`).join(', ') : 'N/A'}
- Previous Recommendations: ${billData.recommendations ? billData.recommendations.join('; ') : 'N/A'}
`;
    } else {
      contextData = 'No specific bill data available, provide general AWS cost optimization advice.';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert AWS cost optimization assistant. You help users understand their AWS bills and provide actionable cost-saving recommendations.

${contextData}

Provide helpful, specific advice about:
- AWS cost optimization strategies
- Service usage patterns
- Best practices for cost management
- Specific recommendations based on their current usage

Be concise, practical, and focus on actionable advice. If the user doesn't have invoice data uploaded yet, encourage them to upload their AWS bill first.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-aws-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
