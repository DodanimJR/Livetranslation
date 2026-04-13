import { useCallback, useState } from 'react';
import { sonioxService, SonioxToken } from '../services/soniox';
import { useTranscriptStore } from '../context/transcriptStore';

// Re-export the type so existing imports still work
export type { TranscriptEntry } from '../context/transcriptStore';

export const useSonioxSession = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Shared state – every component that calls useTranscriptStore (or this
  // hook) will see the same entries, isConnected, and error values.
  const { entries, isConnected, error, addEntry, setConnected, setError, clear } =
    useTranscriptStore();

  const handleTokens = useCallback(
    (tokens: SonioxToken[]) => {
      for (const token of tokens) {
        if (!token.text) continue;

        const isTranslation = token.translation_status === 'translation';
        const type = isTranslation ? 'translation' : 'transcription';

        if (token.is_final) {
          addEntry({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: token.text,
            language: token.language || 'unknown',
            type,
            sourceLanguage: token.source_language,
            speaker: token.speaker,
            timestamp: Date.now(),
            isFinal: true,
          });
        }
        // Non-final tokens are intentionally skipped for now – they update
        // too fast to render individually. A "live preview" line could be
        // added later via a separate ref if desired.
      }
    },
    [addEntry]
  );

  // Connect to Soniox WebSocket (via temporary key from backend)
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
