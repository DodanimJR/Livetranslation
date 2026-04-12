import { useCallback, useState } from 'react';
import { sonioxService } from '../services/soniox';
import type { SonioxTranscriptionResult } from '../types/index';

export const useSonioxSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<SonioxTranscriptionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new session
  const createSession = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const newSessionId = await sonioxService.createSession({
        languageCode: 'es',
        enableTranslation: true,
        translationLanguageCode: 'en',
      });

      setSessionId(newSessionId);
      return newSessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to WebSocket
  const connectSession = useCallback(async (id: string) => {
    try {
      setError(null);
      setIsLoading(true);

      await sonioxService.connectWebSocket(id);
      setIsConnected(true);

      // Set up transcription callback
      sonioxService.onTranscription((result) => {
        setTranscriptionResults((prev) => [...prev, result]);
      });

      // Set up error callback
      sonioxService.onError((err) => {
        setError(err.message);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send audio data to transcription
  const sendAudioData = useCallback((audioData: Float32Array) => {
    try {
      if (!isConnected) {
        console.warn('Session not connected');
        return;
      }
      sonioxService.sendAudioData(audioData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [isConnected]);

  // End the session
  const endSession = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      await sonioxService.endSession();
      setSessionId(null);
      setIsConnected(false);
      setTranscriptionResults([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear transcription results
  const clearResults = useCallback(() => {
    setTranscriptionResults([]);
  }, []);

  return {
    sessionId,
    isConnected,
    isLoading,
    transcriptionResults,
    error,
    createSession,
    connectSession,
    sendAudioData,
    endSession,
    clearResults,
  };
};
