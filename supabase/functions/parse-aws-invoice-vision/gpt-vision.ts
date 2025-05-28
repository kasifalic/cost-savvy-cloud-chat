
export async function analyzeWithGPTVision(pdfDataUrl: string, openAIApiKey: string): Promise<any> {
  console.log('Analyzing PDF with GPT-4 Vision...');
  
  try {
    const messages = [
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
        content: [
          {
            type: 'text',
            text: 'Please analyze this AWS billing document and extract the structured data. This is a PDF document containing billing information.'
          },
          {
            type: 'image_url',
            image_url: {
              url: pdfDataUrl,
              detail: 'high'
            }
          }
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    let extractedContent = data.choices[0].message.content.trim();
    
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
      console.error('Failed to parse GPT Vision response:', parseError);
      console.log('Raw GPT Vision response:', extractedContent);
      
      // Fallback data
      parsedData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'GPT Vision analysis encountered issues. Please ensure the PDF contains clear billing information.',
          'Consider uploading a higher quality PDF for better accuracy.',
          'You can download your bill directly from the AWS console for optimal results.'
        ]
      };
    }
    
    return parsedData;
    
  } catch (error) {
    console.error('GPT Vision analysis failed:', error);
    throw new Error(`GPT Vision analysis failed: ${error.message}`);
  }
}
