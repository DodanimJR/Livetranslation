import React, { useEffect, useRef } from 'react';
import { useTranscriptStore, TranscriptEntry } from '../../context/transcriptStore';
import { usePreferencesStore, TextSize } from '../../context/preferencesStore';
import { broadcastClient } from '../../services/broadcastClient';
import { ViewerToolbar } from './ViewerToolbar';

/* ─── text size mapping ─────────────────────────────────── */
const textSizeClass: Record<TextSize, string> = {
  sm: 'text-base leading-relaxed',
  md: 'text-lg leading-relaxed',
  lg: 'text-xl leading-relaxed',
  xl: 'text-2xl leading-relaxed',
};

/* ─── speaker colors (up to 6, then cycles) ─────────────── */
const speakerColors = [
  { light: 'text-blue-700', dark: 'text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  { light: 'text-emerald-700', dark: 'text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { light: 'text-purple-700', dark: 'text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' },
  { light: 'text-amber-700', dark: 'text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { light: 'text-rose-700', dark: 'text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  { light: 'text-cyan-700', dark: 'text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
];

function getSpeakerColor(speaker: string) {
  const idx = (parseInt(speaker, 10) - 1) || 0;
  return speakerColors[idx % speakerColors.length];
}

/**
 * Group consecutive entries by speaker so we can render speaker
 * labels only when the speaker changes.
 */
interface SpeakerGroup {
  speaker: string | undefined;
  entries: TranscriptEntry[];
}

function groupBySpeaker(entries: TranscriptEntry[]): SpeakerGroup[] {
  const groups: SpeakerGroup[] = [];
  let current: SpeakerGroup | null = null;

  for (const entry of entries) {
    if (!current || current.speaker !== entry.speaker) {
      current = { speaker: entry.speaker, entries: [entry] };
      groups.push(current);
    } else {
      current.entries.push(entry);
    }
  }

  return groups;
}

/* ─── main component ────────────────────────────────────── */

export const LiveFeed: React.FC = () => {
  const { entries, isLive, addEntry, setLive, clear } = useTranscriptStore();
  const { darkMode, textSize } = usePreferencesStore();
  const endRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  // Connect to the broadcast WebSocket on mount
  useEffect(() => {
    broadcastClient.connect({
      onEntry: (entry) => {
        if (seenIds.current.has(entry.id)) return;
        seenIds.current.add(entry.id);
        addEntry(entry);
      },
      onStatus: (live) => setLive(live),
      onClear: () => { seenIds.current.clear(); clear(); },
    });
    return () => broadcastClient.disconnect();
  }, [addEntry, setLive, clear]);

  // Track locally-added ids for dedup
  useEffect(() => {
    for (const e of entries) seenIds.current.add(e.id);
  }, [entries]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const transcriptions = entries.filter((e) => e.type === 'transcription');
  const translations = entries.filter((e) => e.type === 'translation');

  const transcriptionGroups = groupBySpeaker(transcriptions);
  const translationGroups = groupBySpeaker(translations);

  return (
    <div className="space-y-4">
      <ViewerToolbar />

      {/* Translation panel */}
      <div className={`rounded-xl shadow-sm overflow-hidden ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 flex-wrap ${
          darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'
        }`}>
          <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Traduccion / Live Translation (EN)
          </h2>
          {isLive && (
            <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              En Vivo
            </span>
          )}
        </div>

        <div className={`p-4 sm:p-6 min-h-[40vh] max-h-[60vh] overflow-y-auto ${
          darkMode ? 'bg-gray-800/50' : 'bg-blue-50/50'
        }`}>
          {translations.length === 0 ? (
            <EmptyState text={isLive ? 'Escuchando...' : 'Esperando traduccion...'} dark={darkMode} />
          ) : (
            <SpeakerGroupList groups={translationGroups} textSize={textSize} dark={darkMode} />
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Transcription panel */}
      <div className={`rounded-xl shadow-sm overflow-hidden ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`px-4 py-3 sm:px-6 sm:py-4 ${
          darkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'
        }`}>
          <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Transcripcion en Vivo
          </h2>
        </div>

        <div className={`p-4 sm:p-6 min-h-[20vh] max-h-[40vh] overflow-y-auto ${
          darkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
        }`}>
          {transcriptions.length === 0 ? (
            <EmptyState text={isLive ? 'Escuchando...' : 'Esperando transcripcion...'} dark={darkMode} />
          ) : (
            <SpeakerGroupList groups={transcriptionGroups} textSize={textSize} dark={darkMode} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── helpers ───────────────────────────────────────────── */

function EmptyState({ text, dark }: { text: string; dark: boolean }) {
  return (
    <div className="h-full min-h-[12vh] flex items-center justify-center">
      <p className={`text-base font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{text}</p>
    </div>
  );
}

function SpeakerGroupList({ groups, textSize, dark }: {
  groups: SpeakerGroup[];
  textSize: TextSize;
  dark: boolean;
}) {
  const hasMultipleSpeakers = new Set(groups.map((g) => g.speaker).filter(Boolean)).size > 1;

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        const color = group.speaker ? getSpeakerColor(group.speaker) : null;
        const showLabel = hasMultipleSpeakers && group.speaker;

        return (
          <div key={gi}>
            {showLabel && color && (
              <div className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-1 ${
                dark ? color.bg + ' ' + color.dark : color.bg + ' ' + color.light
              }`}>
                Orador {group.speaker}
              </div>
            )}
            <p className={`whitespace-pre-wrap ${textSizeClass[textSize]} ${
              dark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {group.entries.map((e) => e.text).join('')}
            </p>
          </div>
        );
      })}
    </div>
  );
}
