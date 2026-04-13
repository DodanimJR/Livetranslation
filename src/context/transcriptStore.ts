import { create } from 'zustand';

export interface TranscriptEntry {
  id: string;
  text: string;
  language: string;
  type: 'transcription' | 'translation';
  sourceLanguage?: string;
  speaker?: string;
  timestamp: number;
  isFinal: boolean;
}

interface TranscriptState {
  entries: TranscriptEntry[];
  isConnected: boolean;
  error: string | null;

  addEntry: (entry: TranscriptEntry) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  entries: [],
  isConnected: false,
  error: null,

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  setConnected: (connected) =>
    set({ isConnected: connected }),

  setError: (error) =>
    set({ error }),

  clear: () =>
    set({ entries: [], error: null }),
}));
