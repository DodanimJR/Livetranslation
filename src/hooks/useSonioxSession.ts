import { useCallback, useRef, useState } from 'react';
import { sonioxService, SonioxToken } from '../services/soniox';
import { useTranscriptStore } from '../context/transcriptStore';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

// Re-export the type so existing imports still work
export type { TranscriptEntry } from '../context/transcriptStore';

/**
 * Holds the in-progress (non-final) state for a single speaker+type stream.
 * We keep one accumulator per (speaker, type) pair so transcription and
 * translation don't bleed into each other.
 */
interface Accumulator {
  id: string;
  finalText: string;   // committed final words so far in this utterance
  speaker: string | undefined;
  language: string;
  sourceLanguage: string | undefined;
  type: 'transcription' | 'translation';
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useSonioxSession = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { entries, isConnected, isRecording, error, upsertEntry, setConnected, setRecording, setError, clear } =
    useTranscriptStore();

  // One accumulator per (type, speaker) key — persists across renders via ref.
  const accumulators = useRef<Map<string, Accumulator>>(new Map());

  const flushAccumulator = useCallback(
    (acc: Accumulator) => {
      if (!acc.finalText.trim()) return;

      const finalEntry = {
        id: acc.id,
        text: acc.finalText,
        language: acc.language,
        type: acc.type,
        sourceLanguage: acc.sourceLanguage,
        speaker: acc.speaker,
        timestamp: Date.now(),
        isFinal: true,
      };

      // Commit to store (replace the pending preview if it existed)
      upsertEntry(finalEntry);

      // Broadcast final sentence to viewers
      axios.post(`${BACKEND_API_URL}/broadcast/entry`, finalEntry).catch(() => {});
    },
    [upsertEntry]
  );

  const handleTokens = useCallback(
    (tokens: SonioxToken[]) => {
      // Group this batch of tokens by (type, speaker) so we can process each
      // stream independently.
      for (const token of tokens) {
        if (!token.text) continue;

        // Strip Soniox XML control tags like <end>, <eos>, <sc> etc.
        const cleaned = token.text.replace(/<\/?[a-z]+>/gi, '');
        if (!cleaned.trim()) continue;

        const isTranslation = token.translation_status === 'translation';
        const type: 'transcription' | 'translation' = isTranslation ? 'translation' : 'transcription';
        const speaker = token.speaker;
        const accKey = `${type}:${speaker ?? 'none'}`;

        if (token.is_final) {
          // Get or create an accumulator for this stream
          let acc = accumulators.current.get(accKey);
          if (!acc) {
            acc = {
              id: makeId(),
              finalText: '',
              speaker,
              language: token.language || 'unknown',
              sourceLanguage: token.source_language,
              type,
            };
            accumulators.current.set(accKey, acc);
          }

          // Append the final word to the accumulator
          acc.finalText += cleaned;
          acc.language = token.language || acc.language;
          acc.sourceLanguage = token.source_language ?? acc.sourceLanguage;

          // Show the accumulated text as a live (still-growing) entry
          upsertEntry({
            id: acc.id,
            text: acc.finalText,
            language: acc.language,
            type: acc.type,
            sourceLanguage: acc.sourceLanguage,
            speaker: acc.speaker,
            timestamp: Date.now(),
            isFinal: false, // not yet a sentence boundary
          });
        }
        // Non-final tokens: we intentionally do NOT display speculative
        // in-progress words because Soniox continuously rewrites them and
        // showing them causes the jumbled text seen in the bug report.
        // The final tokens alone build a clean, readable sentence in real time.
      }

      // Check for sentence boundaries: Soniox marks utterance ends by emitting
      // a batch where ALL tokens are final (no non-final tokens remain).
      // At that point we flush each accumulator as a committed sentence and
      // start fresh IDs for the next utterance.
      const hasNonFinal = tokens.some((t) => !t.is_final);
      if (!hasNonFinal && tokens.some((t) => t.is_final)) {
        // Determine which streams were touched in this batch
        const touchedKeys = new Set<string>();
        for (const token of tokens) {
          if (!token.is_final) continue;
          const isTranslation = token.translation_status === 'translation';
          const type = isTranslation ? 'translation' : 'transcription';
          touchedKeys.add(`${type}:${token.speaker ?? 'none'}`);
        }

        for (const key of touchedKeys) {
          const acc = accumulators.current.get(key);
          if (acc && acc.finalText.trim()) {
            // Finalize the entry in the store
            upsertEntry({
              id: acc.id,
              text: acc.finalText,
              language: acc.language,
              type: acc.type,
              sourceLanguage: acc.sourceLanguage,
              speaker: acc.speaker,
              timestamp: Date.now(),
              isFinal: true,
            });
            // Broadcast the completed sentence
            axios.post(`${BACKEND_API_URL}/broadcast/entry`, {
              id: acc.id,
              text: acc.finalText,
              language: acc.language,
              type: acc.type,
              sourceLanguage: acc.sourceLanguage,
              speaker: acc.speaker,
              timestamp: Date.now(),
              isFinal: true,
            }).catch(() => {});

            // Start a fresh accumulator for the next sentence
            accumulators.current.set(key, {
              id: makeId(),
              finalText: '',
              speaker: acc.speaker,
              language: acc.language,
              sourceLanguage: acc.sourceLanguage,
              type: acc.type,
            });
          }
        }
      }
    },
    [upsertEntry]
  );

  const connect = useCallback(
    async (sourceLanguage?: string, targetLanguage?: string) => {
      try {
        setError(null);
        setIsLoading(true);
        accumulators.current.clear();

        await sonioxService.connect(
          {
            onTokens: handleTokens,
            onError: (err) => setError(err.message),
            onFinished: () => {
              console.log('Soniox session finished');
              // Flush any remaining accumulator content
              accumulators.current.forEach((acc) => flushAccumulator(acc));
              accumulators.current.clear();
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
    [handleTokens, flushAccumulator, setConnected, setError]
  );

  const sendAudio = useCallback((pcmInt16: Int16Array) => {
    sonioxService.sendAudio(pcmInt16);
  }, []);

  const finish = useCallback(() => {
    sonioxService.finish();
  }, []);

  const disconnect = useCallback(() => {
    // Flush before disconnecting
    accumulators.current.forEach((acc) => flushAccumulator(acc));
    accumulators.current.clear();
    sonioxService.disconnect();
    setConnected(false);
  }, [flushAccumulator, setConnected]);

  const clearEntries = useCallback(() => {
    accumulators.current.clear();
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
