import { useCallback, useRef, useState } from 'react';
import { sonioxService, SonioxToken } from '../services/soniox';

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

export const useSonioxSession = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  // Accumulate non-final text so we can show "live" partial results
  const nonFinalRef = useRef<string>('');

  const handleTokens = useCallback((tokens: SonioxToken[], _isFinal: boolean) => {
    for (const token of tokens) {
      if (!token.text) continue;

      const isTranslation = token.translation_status === 'translation';
      const type = isTranslation ? 'translation' : 'transcription';

      if (token.is_final) {
        // Final token: commit to the transcript list
        setEntries((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: token.text,
            language: token.language || 'unknown',
            type,
            sourceLanguage: token.source_language,
            speaker: token.speaker,
            timestamp: Date.now(),
            isFinal: true,
          },
        ]);
      } else {
        // Non-final: accumulate for live preview
        nonFinalRef.current += token.text;
      }
    }
  }, []);

  // Connect to Soniox WebSocket (via temporary key from backend)
  const connect = useCallback(async (sourceLanguage?: string, targetLanguage?: string) => {
    try {
      setError(null);
      setIsLoading(true);

      await sonioxService.connect(
        {
          onTokens: handleTokens,
          onError: (err) => setError(err.message),
          onFinished: () => {
            console.log('Soniox session finished');
            setIsConnected(false);
          },
        },
        { sourceLanguage, targetLanguage }
      );

      setIsConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleTokens]);

  // Send raw PCM audio
  const sendAudio = useCallback((pcmInt16: Int16Array) => {
    sonioxService.sendAudio(pcmInt16);
  }, []);

  // Graceful finish (sends empty frame, waits for remaining tokens)
  const finish = useCallback(() => {
    sonioxService.finish();
  }, []);

  // Hard disconnect
  const disconnect = useCallback(() => {
    sonioxService.disconnect();
    setIsConnected(false);
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
    nonFinalRef.current = '';
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    entries,
    connect,
    sendAudio,
    finish,
    disconnect,
    clearEntries,
  };
};
