import { create } from 'zustand';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

interface PreferencesState {
  darkMode: boolean;
  textSize: TextSize;

  toggleDarkMode: () => void;
  setTextSize: (size: TextSize) => void;
}

// Read initial values from localStorage
const stored = typeof window !== 'undefined' ? window.localStorage : null;
const initialDark = stored?.getItem('pref_dark') === 'true';
const initialSize = (stored?.getItem('pref_textSize') as TextSize) || 'md';

export const usePreferencesStore = create<PreferencesState>((set) => ({
  darkMode: initialDark,
  textSize: initialSize,

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('pref_dark', String(next));
      return { darkMode: next };
    }),

  setTextSize: (size) => {
    localStorage.setItem('pref_textSize', size);
    set({ textSize: size });
  },
}));
