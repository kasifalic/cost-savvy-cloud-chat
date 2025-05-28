
export async function analyzeWithGPTVision(imageDataUrl: string, openAIApiKey: string): Promise<any> {
  console.log('Analyzing with GPT-4 Vision...');
  
  try {
    // Check if we have a valid image data URL
    if (!imageDataUrl || imageDataUrl === '' || imageDataUrl.startsWith('data:application/pdf')) {
      console.log('Invalid or PDF data detected - Vision API requires image files');
      
      // Return structured fallback response explaining the limitation
      const fallbackData = {
        totalCost: 0,
        costChange: 0,
        billingPeriod: new Date().toISOString().substring(0, 7),
        services: [],
        recommendations: [
          'GPT-4 Vision requires image files (JPG, PNG) - PDF format is not supported.',
          'To use Vision analysis, please convert your AWS bill to JPG or PNG format first.',
          'Alternatively, use the "Text Extraction" method which can process PDF files directly.',
          'You can download your bill from AWS Console and save it as an image for Vision analysis.'
        ]
      };
      
      console.log('Returning fallback data due to format limitation');
      return fallbackData;
    }

    // Validate that it's actually an image data URL
    if (!imageDataUrl.startsWith('data:image/')) {
      console.log('Data URL is not an image format');
      throw new Error('Invalid image format for Vision API');
    }

    // If we have a valid image data URL, proceed with Vision API
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
                  url: imageDataUrl,
                  detail: 'high'
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
    console.log('OpenAI Vision API response received');

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    const content = result.choices[0].message.content;
    console.log('Vision analysis content:', content);

    // Try to parse the JSON response
    try {
      const analyzedData = JSON.parse(content);
      console.log('Successfully parsed Vision analysis:', analyzedData);
      
      // Validate the structure
      if (typeof analyzedData.totalCost !== 'number') {
        analyzedData.totalCost = 0;
      }
      if (typeof analyzedData.costChange !== 'number') {
        analyzedData.costChange = 0;
      }
      if (!analyzedData.services || !Array.isArray(analyzedData.services)) {
        analyzedData.services = [];
      }
      if (!analyzedData.recommendations || !Array.isArray(analyzedData.recommendations)) {
        analyzedData.recommendations = ['Analysis completed successfully'];
      }
      
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
          'Raw analysis: ' + content.substring(0, 200) + '...'
        ]
      };
    }
    
  } catch (error) {
    console.error('GPT Vision analysis failed:', error);
    throw new Error(`GPT Vision analysis failed: ${error.message}`);
  }
}
