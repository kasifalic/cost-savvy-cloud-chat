
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get user's latest AWS invoice data
    const { data: invoices } = await supabase
      .from('aws_invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('processing_status', 'completed')
      .order('upload_date', { ascending: false })
      .limit(1);

    let contextData = '';
    if (invoices && invoices.length > 0) {
      const latestInvoice = invoices[0];
      contextData = `
User's AWS Bill Context:
- Total Cost: $${latestInvoice.total_cost}
- Billing Period: ${latestInvoice.billing_period}
- Services: ${JSON.stringify(latestInvoice.services_data?.services || [])}
- Previous Analysis: ${JSON.stringify(latestInvoice.services_data || {})}
`;
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
