import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { LiveFeed } from '../components/EndUser/LiveFeed';

/**
 * The public-facing page. Shows only the live transcription and
 * translation feed. No admin controls, no login, no navigation
 * to admin. Accessible at /
 */
export const PublicPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LiveFeed />
        </div>
      </main>

      <Footer />
    </div>
  );
};
