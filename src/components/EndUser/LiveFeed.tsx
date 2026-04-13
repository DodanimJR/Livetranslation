import React, { useEffect, useRef } from 'react';
import { Card } from '../Common/Card';
import { useTranscriptStore, TranscriptEntry } from '../../context/transcriptStore';
import { broadcastClient } from '../../services/broadcastClient';

/**
 * LiveFeed displays the real-time transcription and translation.
 *
 * On mount it connects to the backend WebSocket so entries broadcast
 * by the admin appear in real-time on every viewer's screen.
 * The admin's own browser also adds entries directly to the store,
 * so there's no duplication issue – broadcast entries carry unique ids.
 */
export const LiveFeed: React.FC = () => {
  const { entries, isLive, addEntry, setLive, clear } = useTranscriptStore();
  const endRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  // Connect to the broadcast WebSocket on mount
  useEffect(() => {
    broadcastClient.connect({
      onEntry: (entry) => {
        // Deduplicate: admin browser already added the entry locally
        if (seenIds.current.has(entry.id)) return;
        seenIds.current.add(entry.id);
        addEntry(entry);
      },
      onStatus: (live) => {
        setLive(live);
        if (!live) {
          // Session ended – optionally keep entries for review
        }
      },
      onClear: () => {
        seenIds.current.clear();
        clear();
      },
    });

    return () => {
      broadcastClient.disconnect();
    };
  }, [addEntry, setLive, clear]);

  // Also track locally-added entry ids for dedup
  useEffect(() => {
    for (const e of entries) {
      seenIds.current.add(e.id);
    }
  }, [entries]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const transcriptions = entries.filter((e) => e.type === 'transcription');
  const translations = entries.filter((e) => e.type === 'translation');

  return (
    <div className="space-y-6">
      {/* Translation panel (shown first – most useful to viewers) */}
      <Card padding="lg" className="min-h-[24rem] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Traduccion / Live Translation (EN)</h2>
          {isLive && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-blue-50 rounded-lg p-4 border border-blue-200">
          {translations.length === 0 ? (
            <EmptyState text={isLive ? 'Escuchando...' : 'Esperando traduccion...'} />
          ) : (
            <TokenList entries={translations} />
          )}
          <div ref={endRef} />
        </div>
      </Card>

      {/* Transcription panel */}
      <Card padding="lg" className="min-h-[16rem] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Transcripcion en Vivo</h2>

        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
          {transcriptions.length === 0 ? (
            <EmptyState text={isLive ? 'Escuchando...' : 'Esperando transcripcion...'} />
          ) : (
            <TokenList entries={transcriptions} />
          )}
        </div>
      </Card>
    </div>
  );
};

/* ─── helpers ───────────────────────────────────────────── */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
}

function TokenList({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <p className="text-lg leading-relaxed text-gray-900 whitespace-pre-wrap">
      {entries.map((entry) => entry.text).join('')}
    </p>
  );
}
