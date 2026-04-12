// Transcription and Translation Types
export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  language: string;
  isFinal: boolean;
}

export interface TranslationSegment {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

export interface SessionState {
  sessionId: string | null;
  isActive: boolean;
  isRecording: boolean;
  startTime: number | null;
  endTime: number | null;
}

// Audio Device Types
export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'audiotrack';
  groupId: string;
}

export interface AudioLevelData {
  current: number;
  peak: number;
  rms: number;
  timestamp: number;
}

// Soniox Types
export interface SonioxSessionConfig {
  apiKey: string;
  clientUuid: string;
  languageCode: string;
  audioModel?: string;
  enableTranslation?: boolean;
  translationLanguageCode?: string;
}

export interface SonioxTranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  startTime?: number;
  endTime?: number;
  translations?: SonioxTranslation[];
}

export interface SonioxTranslation {
  text: string;
  languageCode: string;
}

// App State Types
export interface AppContextType {
  // Session Management
  session: SessionState;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  
  // Transcription
  transcriptions: TranscriptionSegment[];
  addTranscription: (segment: TranscriptionSegment) => void;
  clearTranscriptions: () => void;
  
  // Translations
  translations: TranslationSegment[];
  addTranslation: (segment: TranslationSegment) => void;
  
  // Audio Devices
  audioDevices: AudioDevice[];
  selectedAudioDevice: AudioDevice | null;
  setSelectedAudioDevice: (device: AudioDevice) => void;
  refreshAudioDevices: () => Promise<void>;
  
  // Audio Levels
  audioLevel: AudioLevelData | null;
  updateAudioLevel: (level: AudioLevelData) => void;
  
  // Configuration
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  
  // UI State
  currentTab: 'user' | 'admin';
  setCurrentTab: (tab: 'user' | 'admin') => void;
  
  // Error Handling
  error: string | null;
  setError: (error: string | null) => void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Church Configuration
export interface ChurchConfig {
  name: string;
  logoUrl?: string;
  description?: string;
  contact?: string;
}
