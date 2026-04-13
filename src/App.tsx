import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { TabNavigation } from './components/Layout/TabNavigation';
import { Footer } from './components/Layout/Footer';
import { LiveFeed } from './components/EndUser/LiveFeed';
import { MicrophoneSetup } from './components/Admin/MicrophoneSetup';

function App() {
  const [currentTab, setCurrentTab] = useState<'user' | 'admin'>('user');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {currentTab === 'user' && <LiveFeed />}
          {currentTab === 'admin' && <MicrophoneSetup />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
