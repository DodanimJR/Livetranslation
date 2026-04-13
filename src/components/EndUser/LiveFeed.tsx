import React, { useEffect, useRef } from 'react';
import { Card } from '../Common/Card';
import { useSonioxSession, TranscriptEntry } from '../../hooks/useSonioxSession';

/**
 * LiveFeed renders the real-time transcript that Soniox produces.
 *
 * Tokens with translation_status === 'original' or 'none' are transcription.
 * Tokens with translation_status === 'translation' are translations.
 *
 * The useSonioxSession hook already separates them for us via `entries`.
 * The hook is shared across the app via the singleton sonioxService,
 * so tokens produced by the Admin tab appear here automatically.
 */
export const LiveFeed: React.FC = () => {
  const { entries, isConnected } = useSonioxSession();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const transcriptions = entries.filter((e) => e.type === 'transcription');
  const translations = entries.filter((e) => e.type === 'translation');

  return (
    <div className="space-y-6">
      {/* Transcription panel */}
      <Card padding="lg" className="min-h-[24rem] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Transcripcion en Vivo</h2>
          {isConnected && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
          {transcriptions.length === 0 ? (
            <EmptyState text="Esperando transcripcion..." />
          ) : (
            <TokenList entries={transcriptions} />
          )}
          <div ref={endRef} />
        </div>
      </Card>

      {/* Translation panel */}
      <Card padding="lg" className="min-h-[16rem] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Traduccion (EN)</h2>

        <div className="flex-1 overflow-y-auto bg-blue-50 rounded-lg p-4 border border-blue-200">
          {translations.length === 0 ? (
            <EmptyState text="Esperando traduccion..." />
          ) : (
            <TokenList entries={translations} />
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="text-xs text-gray-500">
        {transcriptions.length} tokens transcritos &middot; {translations.length} tokens traducidos
      </div>
    </div>
  );
};

/* helpers */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-gray-500">
      <p className="text-lg font-medium">{text}</p>
    </div>
  );
}

function TokenList({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <div className="space-y-1 text-lg leading-relaxed text-gray-900">
      {entries.map((entry) => (
        <span key={entry.id}>
          {entry.text}
        </span>
      ))}
    </div>
  );
}
