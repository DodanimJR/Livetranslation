import { useCallback, useState } from 'react';
import { sonioxService, SonioxToken } from '../services/soniox';
import { useTranscriptStore } from '../context/transcriptStore';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

// Re-export the type so existing imports still work
export type { TranscriptEntry } from '../context/transcriptStore';

export const useSonioxSession = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { entries, isConnected, isRecording, error, addEntry, setConnected, setRecording, setError, clear } =
    useTranscriptStore();

  const handleTokens = useCallback(
    (tokens: SonioxToken[]) => {
      for (const token of tokens) {
        if (!token.text) continue;

        const isTranslation = token.translation_status === 'translation';
        const type = isTranslation ? 'translation' : 'transcription';

        if (token.is_final) {
          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: token.text,
            language: token.language || 'unknown',
            type: type as 'transcription' | 'translation',
            sourceLanguage: token.source_language,
            speaker: token.speaker,
            timestamp: Date.now(),
            isFinal: true,
          };

          // Add to local store (admin sees it immediately)
          addEntry(entry);

          // Broadcast to all viewers via backend
          axios.post(`${BACKEND_API_URL}/broadcast/entry`, entry).catch(() => {
            // non-critical – viewers just won't see this token
          });
        }
      }
    },
    [addEntry]
  );

  const connect = useCallback(
    async (sourceLanguage?: string, targetLanguage?: string) => {
      try {
        setError(null);
        setIsLoading(true);

        await sonioxService.connect(
          {
            onTokens: handleTokens,
            onError: (err) => setError(err.message),
            onFinished: () => {
              console.log('Soniox session finished');
              setConnected(false);
            },
          },
          { sourceLanguage, targetLanguage }
        );

        setConnected(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleTokens, setConnected, setError]
  );

  const sendAudio = useCallback((pcmInt16: Int16Array) => {
    sonioxService.sendAudio(pcmInt16);
  }, []);

  const finish = useCallback(() => {
    sonioxService.finish();
  }, []);

  const disconnect = useCallback(() => {
    sonioxService.disconnect();
    setConnected(false);
  }, [setConnected]);

  const clearEntries = useCallback(() => {
    clear();
  }, [clear]);

  return {
    isConnected,
    isRecording,
    isLoading,
    error,
    entries,
    connect,
    sendAudio,
    finish,
    disconnect,
    clearEntries,
    setRecording,
  };
};
