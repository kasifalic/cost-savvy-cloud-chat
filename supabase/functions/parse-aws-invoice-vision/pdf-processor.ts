
export async function convertPDFToImages(base64Data: string): Promise<string[]> {
  console.log('Converting PDF to images for GPT-4 Vision...');
  
  try {
    // Import pdf-lib for PDF processing
    const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');
    
    // Convert base64 to Uint8Array
    const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    console.log(`PDF has ${pages.length} pages, attempting conversion...`);
    
    // Since true PDF to image conversion is complex in Deno,
    // we'll return empty array to trigger the limitation message
    console.log('PDF to image conversion not fully supported, returning empty array');
    return [];
    
  } catch (error) {
    console.error('PDF processing failed:', error);
    return [];
  }
}

export async function processImageData(base64Data: string, mimeType: string): Promise<string> {
  console.log('Processing image data for GPT-4 Vision...', mimeType);
  
  try {
    // Create proper data URL for image
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    console.log('Image processed successfully for Vision API');
    return dataUrl;
    
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

export async function convertPDFToDataUrl(base64Data: string): Promise<string> {
  console.log('Converting PDF to data URL for GPT-4 Vision...');
  
  try {
    // First try to convert to images
    const images = await convertPDFToImages(base64Data);
    
    if (images.length > 0) {
      // Return the first image for Vision processing
      return images[0];
    }
    
    // For PDFs, return empty string to trigger limitation message
    console.log('PDF cannot be processed by Vision API directly');
    return '';
    
  } catch (error) {
    console.error('PDF conversion failed:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}
