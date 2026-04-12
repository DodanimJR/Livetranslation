import type { SonioxSessionConfig, SonioxTranscriptionResult } from '../types/index.js';
import { languageConfig } from './config.js';
import axios from 'axios';

// Backend API URL - points to the Express server
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

export class SonioxService {
  private sessionId: string | null = null;
  private websocket: WebSocket | null = null;
  private transcriptionCallback: ((result: SonioxTranscriptionResult) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private wsUrl: string | null = null;

  /**
   * Create a new Soniox session for transcription
   */
  async createSession(config?: Partial<SonioxSessionConfig>): Promise<string> {
    try {
      const sessionConfig = {
        languageCode: config?.languageCode || languageConfig.sourceLanguage,
        audioModel: config?.audioModel || 'default',
        enableTranslation: config?.enableTranslation !== false,
        translationLanguageCode: config?.translationLanguageCode || languageConfig.targetLanguage,
      };

      // Call backend API instead of Soniox directly
      const response = await axios.post<any>(
        `${BACKEND_API_URL}/soniox/sessions`,
        sessionConfig
      );

      const sessionId = response.data.data?.sessionId as string | undefined;
      if (!sessionId) {
        throw new Error('Failed to create session: No session ID returned');
      }

      this.sessionId = sessionId;
      this.wsUrl = response.data.data?.wsUrl || null;
      console.log('✅ Soniox session created:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to create Soniox session:', errorMessage);
      throw new Error(`Failed to create Soniox session: ${errorMessage}`);
    }
  }

  /**
   * Connect to WebSocket for real-time transcription
   */
  async connectWebSocket(sessionId: string): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        // Get WebSocket URL from backend if we don't have it
        if (!this.wsUrl) {
          this.wsUrl = this.getWebSocketUrl(sessionId);
        }

        try {
          console.log('🔌 Connecting to WebSocket:', this.wsUrl);
          this.websocket = new WebSocket(this.wsUrl);

          this.websocket.onopen = () => {
            console.log('✅ Connected to Soniox WebSocket');
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
            console.error('❌ WebSocket error:', error);
            if (this.errorCallback) {
              this.errorCallback(error);
            }
            reject(error);
          };

          this.websocket.onclose = () => {
            console.log('🔌 Disconnected from Soniox WebSocket');
          };
        } catch (wsError) {
          const errorMessage = wsError instanceof Error ? wsError.message : 'Unknown error';
          console.error('❌ Failed to create WebSocket:', errorMessage);
          reject(new Error(`Failed to create WebSocket: ${errorMessage}`));
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to connect to Soniox:', errorMessage);
      throw new Error(`Failed to connect to Soniox: ${errorMessage}`);
    }
  }

  /**
   * Send audio data to Soniox for transcription
   */
  sendAudioData(audioData: Float32Array): void {
    try {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        console.warn('⚠️  WebSocket is not open');
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

      if (this.sessionId) {
        await axios.post(`${BACKEND_API_URL}/soniox/sessions/${this.sessionId}/end`);
      }

      this.sessionId = null;
      this.wsUrl = null;
      console.log('✅ Soniox session ended');
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
   * This is constructed on the backend, but we need to build it here for fallback
   */
  private getWebSocketUrl(sessionId: string): string {
    // The actual WebSocket URL is returned by the backend
    // This is just a fallback construction
    const backendUrl = BACKEND_API_URL.replace('/api', '');
    const protocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = backendUrl.replace(/^https?:\/\//, '');
    
    // Note: The actual WebSocket connection should use the URL from backend's createSession response
    // which contains the real Soniox WebSocket URL
    return `${protocol}://${baseUrl}/soniox/stream/${sessionId}`;
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
