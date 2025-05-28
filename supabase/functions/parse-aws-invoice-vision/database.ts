
export async function storeExtractionRecord(
  supabase: any,
  fileName: string,
  fileSize: number
): Promise<any> {
  console.log('Storing processing record in Supabase...');
  
  const { data: extractionRecord, error: dbError } = await supabase
    .from('pdf_extractions')
    .insert({
      filename: fileName,
      raw_text: `GPT-4 Vision processing of PDF document`,
      file_size: fileSize,
      extraction_method: 'gpt4_vision',
      processing_status: 'processed'
    })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to store extraction record:', dbError);
    throw new Error('Failed to store processing data');
  }

  console.log('Processing record stored with ID:', extractionRecord.id);
  return extractionRecord;
}

export async function updateExtractionRecord(
  supabase: any,
  extractionId: string,
  processedData: any
): Promise<void> {
  const { error: updateError } = await supabase
    .from('pdf_extractions')
    .update({
      processed_data: processedData,
      processing_status: 'processed',
      processed_at: new Date().toISOString()
    })
    .eq('id', extractionId);

  if (updateError) {
    console.error('Failed to update extraction record:', updateError);
  }
}
