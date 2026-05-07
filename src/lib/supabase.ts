import { createClient } from '@supabase/supabase-js';

// These should be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface DocumentMeta {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_at: string;
}

// Upload file to Supabase Storage
export const uploadToStorage = async (file: File): Promise<{ path: string | null; error: Error | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`; // We'll use a public prefix or just root, but PRD recommended private bucket with signed URLs

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return { path: data.path, error: null };
  } catch (error: any) {
    return { path: null, error };
  }
};

// Save metadata to Database
export const saveDocumentMetadata = async (metadata: Omit<DocumentMeta, 'id' | 'uploaded_at'>) => {
  const { data, error } = await supabase
    .from('documents')
    .insert([metadata])
    .select()
    .single();

  return { data, error };
};

// Fetch all documents
export const fetchDocuments = async () => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  return { data, error };
};

// Delete document
export const deleteDocument = async (id: string, storagePath: string) => {
  // 1. Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([storagePath]);

  if (storageError) return { error: storageError };

  // 2. Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  return { error: dbError };
};

// Get signed URL for viewing/downloading (valid for 1 hour)
export const getFileUrl = async (path: string, download: boolean = false) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600, {
      download: download
    });

  return { url: data?.signedUrl, error };
};
