import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { LiveFeed } from '../components/EndUser/LiveFeed';
import { usePreferencesStore } from '../context/preferencesStore';

/**
 * Public-facing page. Shows the live transcription / translation
 * feed with dark mode and text size controls. Accessible at /
 */
export const PublicPage = () => {
  const darkMode = usePreferencesStore((s) => s.darkMode);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <LiveFeed />
        </div>
      </main>

      <Footer />
    </div>
  );
};
