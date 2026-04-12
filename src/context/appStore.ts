import { create } from 'zustand';
import type {
  TranscriptionSegment,
  TranslationSegment,
  AudioDevice,
  AudioLevelData,
  SessionState,
  AppContextType,
} from '../types/index';

const initialSessionState: SessionState = {
  sessionId: null,
  isActive: false,
  isRecording: false,
  startTime: null,
  endTime: null,
};

export const useAppStore = create<AppContextType>((set) => ({
  // Session Management
  session: initialSessionState,

  startSession: async () => {
    set((state) => ({
      session: {
        ...state.session,
        isActive: true,
        isRecording: true,
        startTime: Date.now(),
      },
    }));
  },

  stopSession: async () => {
    set((state) => ({
      session: {
        ...state.session,
        isActive: false,
        isRecording: false,
        endTime: Date.now(),
      },
    }));
  },

  // Transcription
  transcriptions: [],

  addTranscription: (segment: TranscriptionSegment) => {
    set((state) => ({
      transcriptions: [...state.transcriptions, segment],
    }));
  },

  clearTranscriptions: () => {
    set({ transcriptions: [] });
  },

  // Translations
  translations: [],

  addTranslation: (segment: TranslationSegment) => {
    set((state) => ({
      translations: [...state.translations, segment],
    }));
  },

  // Audio Devices
  audioDevices: [],

  selectedAudioDevice: null,

  setSelectedAudioDevice: (device: AudioDevice) => {
    set({ selectedAudioDevice: device });
  },

  refreshAudioDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === 'audioinput');

      const formattedDevices: AudioDevice[] = audioInputs.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${audioInputs.indexOf(device) + 1}`,
        kind: 'audioinput',
        groupId: device.groupId,
      }));

      set({ audioDevices: formattedDevices });
    } catch (error) {
      console.error('Failed to refresh audio devices:', error);
    }
  },

  // Audio Levels
  audioLevel: null,

  updateAudioLevel: (level: AudioLevelData) => {
    set({ audioLevel: level });
  },

  // Configuration
  sourceLanguage: 'es',
  targetLanguage: 'en',

  setSourceLanguage: (lang: string) => {
    set({ sourceLanguage: lang });
  },

  setTargetLanguage: (lang: string) => {
    set({ targetLanguage: lang });
  },

  // UI State
  currentTab: 'user',

  setCurrentTab: (tab: 'user' | 'admin') => {
    set({ currentTab: tab });
  },

  // Error Handling
  error: null,

  setError: (error: string | null) => {
    set({ error });
  },
}));
