
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

export async function uploadPDFToStorage(
  supabase: any,
  base64Data: string, 
  fileName: string
): Promise<string> {
  console.log('Uploading PDF to Supabase Storage...');
  
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}-${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('pdf-uploads')
      .upload(uniqueFileName, bytes, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    console.log('PDF uploaded successfully:', data.path);
    return data.path;
    
  } catch (error) {
    console.error('Failed to upload PDF:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}
