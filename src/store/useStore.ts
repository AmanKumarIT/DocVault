import { create } from 'zustand';
import { DocumentMeta } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface ViewerData {
  isOpen: boolean;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
}

interface AppState {
  user: User | null;
  isAuthInitialized: boolean;
  setUser: (user: User | null) => void;
  setAuthInitialized: (val: boolean) => void;

  documents: DocumentMeta[];
  setDocuments: (docs: DocumentMeta[]) => void;
  addDocument: (doc: DocumentMeta) => void;
  removeDocument: (id: string) => void;
  
  isUploading: boolean;
  uploadProgress: number;
  setUploading: (status: boolean, progress?: number) => void;
  
  viewer: ViewerData;
  openViewer: (fileUrl: string, fileType: string, fileName: string) => void;
  closeViewer: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthInitialized: false,
  setUser: (user) => set({ user }),
  setAuthInitialized: (val) => set({ isAuthInitialized: val }),

  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  removeDocument: (id) => set((state) => ({ 
    documents: state.documents.filter((d) => d.id !== id) 
  })),

  isUploading: false,
  uploadProgress: 0,
  setUploading: (status, progress = 0) => set({ isUploading: status, uploadProgress: progress }),

  viewer: {
    isOpen: false,
    fileUrl: null,
    fileType: null,
    fileName: null
  },
  openViewer: (fileUrl, fileType, fileName) => set({
    viewer: { isOpen: true, fileUrl, fileType, fileName }
  }),
  closeViewer: () => set({
    viewer: { isOpen: false, fileUrl: null, fileType: null, fileName: null }
  })
}));
