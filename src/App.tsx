import { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { TabNavigation } from './components/Layout/TabNavigation';
import { Footer } from './components/Layout/Footer';
import { LiveFeed } from './components/EndUser/LiveFeed';
import { MicrophoneSetup } from './components/Admin/MicrophoneSetup';
import { AdminLogin } from './components/Admin/AdminLogin';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentTab, setCurrentTab] = useState<'user' | 'admin'>('user');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // On mount, check if there's a saved admin token
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      axios
        .get(`${BACKEND_API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => setIsAdminAuth(true))
        .catch(() => sessionStorage.removeItem('admin_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAdminAuth(false);
    setCurrentTab('user');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/*
            Use CSS visibility instead of conditional rendering so the
            admin tab keeps its state (recording, audio context, etc.)
            when the user switches to the members tab and back.
          */}
          <div style={{ display: currentTab === 'user' ? 'block' : 'none' }}>
            <LiveFeed />
          </div>

          <div style={{ display: currentTab === 'admin' ? 'block' : 'none' }}>
            {!authChecked ? (
              <div className="text-center py-12 text-gray-500">Verificando...</div>
            ) : isAdminAuth ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 transition"
                  >
                    Cerrar sesion
                  </button>
                </div>
                <MicrophoneSetup />
              </div>
            ) : (
              <AdminLogin onAuthenticated={() => setIsAdminAuth(true)} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
