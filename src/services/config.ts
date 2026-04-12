import type { ChurchConfig } from '../types/index';

export const churchConfig: ChurchConfig = {
  name: import.meta.env.VITE_CHURCH_NAME || 'Iglesia Adventista UNADECA',
  logoUrl: import.meta.env.VITE_CHURCH_LOGO_URL,
  description: 'Live Transcription & Translation Service',
};

export const sonioxConfig = {
  apiKey: import.meta.env.VITE_SONIOX_API_KEY || '',
  apiUrl: import.meta.env.VITE_SONIOX_API_URL || 'https://api.soniox.com',
};

export const audioConfig = {
  sampleRate: parseInt(import.meta.env.VITE_AUDIO_SAMPLE_RATE || '16000'),
  bufferSize: parseInt(import.meta.env.VITE_AUDIO_BUFFER_SIZE || '4096'),
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export const languageConfig = {
  sourceLanguage: import.meta.env.VITE_DEFAULT_SOURCE_LANGUAGE || 'es',
  targetLanguage: import.meta.env.VITE_DEFAULT_TARGET_LANGUAGE || 'en',
  supportedLanguages: {
    es: 'Español',
    en: 'English',
    fr: 'Français',
    pt: 'Português',
    de: 'Deutsch',
  },
};

export const appConfig = {
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  isDebugEnabled: import.meta.env.VITE_APP_DEBUG === 'true',
};
