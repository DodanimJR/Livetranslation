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
  isConnected: boolean;   // Soniox WebSocket is open (admin only)
  isRecording: boolean;   // audio is actively being captured + streamed
  isLive: boolean;        // broadcast session is live (viewers see this)
  error: string | null;

  addEntry: (entry: TranscriptEntry) => void;
  /** Replace an existing entry by id, or append if not found. */
  upsertEntry: (entry: TranscriptEntry) => void;
  setConnected: (connected: boolean) => void;
  setRecording: (recording: boolean) => void;
  setLive: (live: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set) => ({
  entries: [],
  isConnected: false,
  isRecording: false,
  isLive: false,
  error: null,

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  upsertEntry: (entry) =>
    set((state) => {
      const idx = state.entries.findIndex((e) => e.id === entry.id);
      if (idx === -1) {
        return { entries: [...state.entries, entry] };
      }
      const updated = [...state.entries];
      updated[idx] = entry;
      return { entries: updated };
    }),

  setConnected: (connected) =>
    set({ isConnected: connected }),

  setRecording: (recording) =>
    set({ isRecording: recording }),

  setLive: (live) =>
    set({ isLive: live }),

  setError: (error) =>
    set({ error }),

  clear: () =>
    set({ entries: [], error: null }),
}));
