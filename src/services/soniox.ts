import type { SonioxSessionConfig, SonioxTranscriptionResult, ApiResponse } from '../types/index.js';
import { sonioxConfig, languageConfig } from './config.js';
import axios from 'axios';

export class SonioxService {
  private apiKey: string;
  private apiUrl: string;
  private sessionId: string | null = null;
  private websocket: WebSocket | null = null;
  private transcriptionCallback: ((result: SonioxTranscriptionResult) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.apiKey = sonioxConfig.apiKey;
    this.apiUrl = sonioxConfig.apiUrl;

    if (!this.apiKey) {
      console.warn('Soniox API key not configured. Please set VITE_SONIOX_API_KEY');
    }
  }

  /**
   * Create a new Soniox session for transcription
   */
  async createSession(config?: Partial<SonioxSessionConfig>): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('Soniox API key is not configured');
      }

      const sessionConfig: SonioxSessionConfig = {
        apiKey: this.apiKey,
        clientUuid: this.generateClientUuid(),
        languageCode: config?.languageCode || languageConfig.sourceLanguage,
        audioModel: config?.audioModel || 'default',
        enableTranslation: config?.enableTranslation !== false,
        translationLanguageCode: config?.translationLanguageCode || languageConfig.targetLanguage,
      };

      // Create session via API
      const response = await axios.post<ApiResponse<{ sessionId: string }>>(
        `${this.apiUrl}/v1/sessions`,
        {
          languageCode: sessionConfig.languageCode,
          audioModel: sessionConfig.audioModel,
          enableTranslation: sessionConfig.enableTranslation,
          translationLanguageCode: sessionConfig.translationLanguageCode,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.data?.sessionId) {
        this.sessionId = response.data.data.sessionId;
        console.log('Soniox session created:', this.sessionId);
        return this.sessionId;
      }

      throw new Error('Failed to create session: No session ID returned');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create Soniox session: ${errorMessage}`);
    }
  }

  /**
   * Connect to WebSocket for real-time transcription
   */
  async connectWebSocket(sessionId: string): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const wsUrl = this.getWebSocketUrl(sessionId);
        
        try {
          this.websocket = new WebSocket(wsUrl);

          this.websocket.onopen = () => {
            console.log('Connected to Soniox WebSocket');
            resolve();
          };

          this.websocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleTranscriptionMessage(data);
            } catch (parseError) {
              console.error('Failed to parse WebSocket message:', parseError);
            }
          };

          this.websocket.onerror = (event) => {
            const error = new Error(`WebSocket error: ${event}`);
            if (this.errorCallback) {
              this.errorCallback(error);
            }
            reject(error);
          };

          this.websocket.onclose = () => {
            console.log('Disconnected from Soniox WebSocket');
          };
        } catch (wsError) {
          const errorMessage = wsError instanceof Error ? wsError.message : 'Unknown error';
          reject(new Error(`Failed to create WebSocket: ${errorMessage}`));
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to connect to Soniox: ${errorMessage}`);
    }
  }

  /**
   * Send audio data to Soniox for transcription
   */
  sendAudioData(audioData: Float32Array): void {
    try {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket is not open');
        return;
      }

      // Convert Float32Array to base64 for transmission
      const int16Array = this.float32ToInt16(audioData);
      const base64Audio = this.arrayBufferToBase64(int16Array.buffer);

      const message = {
        type: 'audio_data',
        audio: base64Audio,
        timestamp: Date.now(),
      };

      this.websocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send audio data:', error);
    }
  }

  /**
   * Register callback for transcription results
   */
  onTranscription(callback: (result: SonioxTranscriptionResult) => void): void {
    this.transcriptionCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * End the transcription session
   */
  async endSession(): Promise<void> {
    try {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      if (this.sessionId && this.apiKey) {
        await axios.post(
          `${this.apiUrl}/v1/sessions/${this.sessionId}/end`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      this.sessionId = null;
      console.log('Soniox session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Handle incoming transcription messages from WebSocket
   */
  private handleTranscriptionMessage(data: any): void {
    if (!this.transcriptionCallback) {
      return;
    }

    try {
      const result: SonioxTranscriptionResult = {
        text: data.text || '',
        isFinal: data.isFinal || false,
        confidence: data.confidence,
        startTime: data.startTime,
        endTime: data.endTime,
        translations: data.translations,
      };

      this.transcriptionCallback(result);
    } catch (error) {
      console.error('Error processing transcription message:', error);
    }
  }

  /**
   * Get WebSocket URL for the session
   */
  private getWebSocketUrl(sessionId: string): string {
    const protocol = this.apiUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = this.apiUrl.replace(/^https?:\/\//, '');
    return `${protocol}://${baseUrl}/v1/sessions/${sessionId}/stream?key=${this.apiKey}`;
  }

  /**
   * Generate a unique client UUID
   */
  private generateClientUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Convert Float32Array to Int16Array for audio transmission
   */
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Export singleton instance
export const sonioxService = new SonioxService();
