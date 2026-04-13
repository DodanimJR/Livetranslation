import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
const SONIOX_WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';

/**
 * A single Soniox token as returned by the WebSocket API.
 * Docs: https://soniox.com/docs/stt/api-reference/websocket-api#response
 */
export interface SonioxToken {
  text: string;
  start_ms?: number;
  end_ms?: number;
  confidence: number;
  is_final: boolean;
  speaker?: string;
  language?: string;
  source_language?: string;
  translation_status?: 'none' | 'original' | 'translation';
}

export interface SonioxResponse {
  tokens: SonioxToken[];
  final_audio_proc_ms: number;
  total_audio_proc_ms: number;
  finished?: boolean;
  error_code?: number;
  error_message?: string;
}

export interface SonioxCallbacks {
  onTokens: (tokens: SonioxToken[], isFinal: boolean) => void;
  onError: (error: Error) => void;
  onFinished: () => void;
}

export class SonioxService {
  private websocket: WebSocket | null = null;
  private callbacks: SonioxCallbacks | null = null;
  private temporaryApiKey: string | null = null;

  /**
   * Step 1: Get a temporary API key from our backend
   * (backend calls Soniox REST API so the real key stays server-side)
   */
  async fetchTemporaryKey(): Promise<string> {
    const response = await axios.post(`${BACKEND_API_URL}/soniox/temporary-key`);
    const data = response.data;

    if (!data.success || !data.data?.apiKey) {
      throw new Error(data.error || 'Failed to get temporary API key');
    }

    this.temporaryApiKey = data.data.apiKey as string;
    console.log('Temporary API key obtained, expires:', data.data.expiresAt);
    return this.temporaryApiKey!;
  }

  /**
   * Step 2: Open a WebSocket to Soniox and send config as the first message.
   *
   * The Soniox WebSocket protocol:
   *  1. Connect to wss://stt-rt.soniox.com/transcribe-websocket
   *  2. Send JSON config (with api_key, model, translation, etc.)
   *  3. Send raw audio as binary frames
   *  4. Receive JSON responses with tokens
   *  5. Send empty string to signal end-of-audio
   */
  async connect(
    callbacks: SonioxCallbacks,
    options?: {
      sourceLanguage?: string;
      targetLanguage?: string;
    }
  ): Promise<void> {
    this.callbacks = callbacks;

    if (!this.temporaryApiKey) {
      await this.fetchTemporaryKey();
    }

    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(SONIOX_WS_URL);

      this.websocket.onopen = () => {
        console.log('WebSocket connected, sending config...');

        // Send the config as the first message per Soniox protocol
        const config = this.buildConfig(
          options?.sourceLanguage || 'es',
          options?.targetLanguage || 'en',
        );
        this.websocket!.send(JSON.stringify(config));
        console.log('Config sent. Ready to stream audio.');
        resolve();
      };

      this.websocket.onmessage = (event) => {
        try {
          const response: SonioxResponse = JSON.parse(event.data as string);

          // Handle errors from Soniox
          if (response.error_code) {
            const error = new Error(
              `Soniox error ${response.error_code}: ${response.error_message}`
            );
            this.callbacks?.onError(error);
            return;
          }

          // Process tokens
          if (response.tokens && response.tokens.length > 0) {
            const hasFinal = response.tokens.some((t) => t.is_final);
            this.callbacks?.onTokens(response.tokens, hasFinal);
          }

          // Session finished
          if (response.finished) {
            this.callbacks?.onFinished();
          }
        } catch (parseError) {
          console.error('Failed to parse Soniox message:', parseError);
        }
      };

      this.websocket.onerror = () => {
        const error = new Error('WebSocket connection error');
        this.callbacks?.onError(error);
        reject(error);
      };

      this.websocket.onclose = (event) => {
        console.log(`WebSocket closed: code=${event.code} reason=${event.reason}`);
      };
    });
  }

  /**
   * Send raw PCM audio data as a binary frame.
   * The audio must be Int16 PCM, 16 kHz, mono.
   */
  sendAudio(pcmInt16Data: Int16Array): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    // Send the raw bytes directly as a binary frame
    this.websocket.send(pcmInt16Data.buffer as ArrayBuffer);
  }

  /**
   * Signal end-of-audio and close.
   * Per Soniox docs: send an empty string to finish the stream.
   */
  finish(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.websocket.send('');
  }

  /**
   * Hard disconnect without finishing.
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.callbacks = null;
    this.temporaryApiKey = null;
  }

  /**
   * Check if the WebSocket is currently open.
   */
  isConnected(): boolean {
    return !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }

  /**
   * Build the Soniox config object sent as the first WebSocket message.
   * Docs: https://soniox.com/docs/stt/api-reference/websocket-api#configuration
   */
  private buildConfig(sourceLanguage: string, targetLanguage: string) {
    return {
      api_key: this.temporaryApiKey,
      model: 'stt-rt-v4',
      quality_level: 1,
      audio_format: 'pcm_s16le',
      sample_rate: 16000,
      num_channels: 1,
      language_hints: [sourceLanguage, targetLanguage],
      enable_language_identification: true,
      enable_speaker_diarization: true,
      enable_endpoint_detection: true,
      context: {
        general: [
          { key: 'domain', value: 'Religion' },
          { key: 'topic', value: 'Church service' },
          { key: 'organization', value: 'Iglesia Adventista UNADECA' },
        ],
      },
      translation: {
        type: 'one_way',
        target_language: targetLanguage,
      },
    };
  }
}

// Singleton
export const sonioxService = new SonioxService();
