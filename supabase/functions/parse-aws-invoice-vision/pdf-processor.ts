
export async function convertPDFToDataUrl(base64Data: string): Promise<string> {
  console.log('Converting PDF to data URL for GPT-4 Vision...');
  
  try {
    // Create a data URL for the PDF
    const pdfDataUrl = `data:application/pdf;base64,${base64Data}`;
    console.log('PDF converted to data URL successfully');
    return pdfDataUrl;
    
  } catch (error) {
    console.error('PDF conversion failed:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}
