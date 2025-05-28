
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
    
    console.log('Received message:', message);
    console.log('Received billData:', JSON.stringify(billData, null, 2));
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create detailed context from bill data
    let contextData = '';
    if (billData && billData.totalCost) {
      const services = billData.services || [];
      const recommendations = billData.recommendations || [];
      
      contextData = `
CURRENT AWS BILL ANALYSIS:
- Total Monthly Cost: $${billData.totalCost}
- Billing Period: ${billData.billingPeriod || 'Current Period'}
- Cost Change vs Previous Month: ${billData.costChange || 0}%

SERVICES BREAKDOWN:
${services.map((service: any) => 
  `- ${service.name}: $${service.cost} (${service.change > 0 ? '+' : ''}${service.change}% change) - ${service.description}`
).join('\n')}

EXISTING RECOMMENDATIONS:
${recommendations.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

SUMMARY:
- Total Services: ${services.length}
- Highest Cost Service: ${services.length > 0 ? services.reduce((max: any, service: any) => service.cost > max.cost ? service : max).name : 'N/A'}
- Services with Cost Increases: ${services.filter((s: any) => s.change > 0).length}
- Services with Cost Decreases: ${services.filter((s: any) => s.change < 0).length}
`;
    } else {
      contextData = 'No specific bill data available. User has not uploaded their AWS bill yet.';
    }

    console.log('Context data:', contextData);

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
            content: `You are an expert AWS cost optimization assistant. You have access to the user's actual AWS billing data and can provide specific, actionable advice.

${contextData}

Your role is to:
1. Answer questions about their specific AWS costs and usage
2. Provide personalized cost optimization recommendations
3. Explain AWS services and pricing in simple terms
4. Suggest specific actions they can take to reduce costs
5. Help them understand their billing patterns and trends

Always reference their actual data when possible. Be specific about dollar amounts, service names, and cost changes. If they ask about a service not in their bill, let them know you don't see usage for that service in their current bill.

Keep responses concise but informative. Use bullet points for lists and be actionable in your advice.`
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
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Generated response:', assistantMessage);

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
