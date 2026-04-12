import React, { useEffect, useRef } from 'react';
import { Card } from '../Common/Card';
import type { TranscriptionSegment, TranslationSegment } from '../../types/index';

interface LiveFeedProps {
  transcriptions: TranscriptionSegment[];
  translations: TranslationSegment[];
  isLive: boolean;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({
  transcriptions,
  translations,
  isLive,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions, translations]);

  return (
    <Card padding="lg" className="h-96 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Transmisión en Vivo</h2>
        {isLive && (
          <div className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            EN VIVO
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
        {transcriptions.length === 0 && translations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">Esperando transcripción...</p>
              <p className="text-sm">El contenido aparecerá aquí</p>
            </div>
          </div>
        ) : (
          <>
            {transcriptions.map((segment) => (
              <div key={segment.id} className="mb-3">
                <div className="text-sm text-gray-500 mb-1">
                  {new Date(segment.timestamp).toLocaleTimeString('es-ES')}
                </div>
                <p className="text-lg text-gray-900 leading-relaxed">{segment.text}</p>
                {segment.confidence && (
                  <div className="text-xs text-gray-400 mt-1">
                    Confianza: {Math.round(segment.confidence * 100)}%
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        {transcriptions.length} segmentos | {translations.length} traducciones
      </div>
    </Card>
  );
};
