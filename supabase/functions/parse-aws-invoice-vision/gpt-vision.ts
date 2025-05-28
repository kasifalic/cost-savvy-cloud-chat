
export async function analyzeWithGPTVision(pdfDataUrl: string, openAIApiKey: string): Promise<any> {
  console.log('Analyzing with GPT-4 Vision...');
  
  try {
    // Check if the data URL is a PDF (which Vision API can't handle)
    if (pdfDataUrl.startsWith('data:application/pdf')) {
      console.log('PDF detected - Vision API cannot process PDF files directly');
      
      // Return structured fallback response explaining the limitation
      const fallbackData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'GPT-4 Vision requires image files (PNG, JPG) - PDF format is not supported.',
          'To use Vision analysis, please convert your AWS bill to PNG or JPG format first.',
          'Alternatively, use the "Text Extraction" method which can process PDF files directly.',
          'You can download your bill from AWS Console and convert it to an image format for Vision analysis.'
        ]
      };
      
      console.log('Returning fallback data due to PDF format limitation');
      return fallbackData;
    }

    // If we have an image data URL, proceed with Vision API
    console.log('Processing image with GPT-4 Vision API...');
    
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
            content: `You are an expert at analyzing AWS billing documents. Extract and analyze the following information from the AWS bill image:
            
            1. Total cost for the billing period
            2. Billing period (month/year)
            3. Top 5 services by cost with their individual costs
            4. Cost comparison with previous period if available
            5. Cost optimization recommendations
            
            Return the data in this exact JSON format:
            {
              "totalCost": number,
              "costChange": number (positive for increase, negative for decrease),
              "billingPeriod": "YYYY-MM",
              "services": [
                {"name": "service_name", "cost": number, "usage": "usage_info"}
              ],
              "recommendations": ["recommendation1", "recommendation2", ...]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this AWS billing document and extract the cost information as specified.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: pdfDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI Vision API response:', result);

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    const content = result.choices[0].message.content;
    console.log('Vision analysis content:', content);

    // Try to parse the JSON response
    try {
      const analyzedData = JSON.parse(content);
      console.log('Successfully parsed Vision analysis:', analyzedData);
      return analyzedData;
    } catch (parseError) {
      console.error('Failed to parse Vision analysis as JSON:', parseError);
      
      // Fallback with extracted text content
      return {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'Vision analysis completed but data extraction needs refinement.',
          'Raw analysis: ' + content.substring(0, 500) + '...'
        ]
      };
    }
    
  } catch (error) {
    console.error('GPT Vision analysis failed:', error);
    throw new Error(`GPT Vision analysis failed: ${error.message}`);
  }
}
