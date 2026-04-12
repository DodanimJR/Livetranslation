import { useEffect } from 'react';
import { Header } from '@components/Layout/Header';
import { TabNavigation } from '@components/Layout/TabNavigation';
import { Footer } from '@components/Layout/Footer';
import { LiveFeed } from '@components/EndUser/LiveFeed';
import { TranslationDisplay } from '@components/EndUser/TranslationDisplay';
import { MicrophoneSetup } from '@components/Admin/MicrophoneSetup';
import { Card } from '@components/Common/Card';
import { useAppStore } from './context/appStore';

function App() {
  const {
    currentTab,
    setCurrentTab,
    transcriptions,
    translations,
    sourceLanguage,
    targetLanguage,
    session,
    refreshAudioDevices,
  } = useAppStore();

  // Refresh audio devices on mount
  useEffect(() => {
    refreshAudioDevices();
  }, [refreshAudioDevices]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* End User Tab */}
          {currentTab === 'user' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LiveFeed
                    transcriptions={transcriptions}
                    translations={translations}
                    isLive={session.isActive}
                  />
                </div>
                <div>
                  <TranslationDisplay
                    translations={translations}
                    targetLanguage={targetLanguage}
                  />
                </div>
              </div>

              {/* Language Info Card */}
              <Card padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Idioma Original</p>
                    <p className="text-lg font-semibold text-gray-900">{sourceLanguage.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Idioma de Traducción</p>
                    <p className="text-lg font-semibold text-gray-900">{targetLanguage.toUpperCase()}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Admin Tab */}
          {currentTab === 'admin' && (
            <div>
              <MicrophoneSetup />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
