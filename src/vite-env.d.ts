/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SONIOX_API_KEY: string;
  readonly VITE_SONIOX_API_URL: string;
  readonly VITE_CHURCH_NAME: string;
  readonly VITE_CHURCH_LOGO_URL?: string;
  readonly VITE_AUDIO_SAMPLE_RATE: string;
  readonly VITE_AUDIO_BUFFER_SIZE: string;
  readonly VITE_DEFAULT_SOURCE_LANGUAGE: string;
  readonly VITE_DEFAULT_TARGET_LANGUAGE: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_APP_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
