import { useState, useEffect } from 'react';
import { Footer } from '../components/Layout/Footer';
import { MicrophoneSetup } from '../components/Admin/MicrophoneSetup';
import { AdminLogin } from '../components/Admin/AdminLogin';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Admin page. Only accessible via /admin URL — not linked from
 * the public UI. Requires password authentication.
 */
export const AdminPage = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      axios
        .get(`${BACKEND_API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => setIsAuth(true))
        .catch(() => sessionStorage.removeItem('admin_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuth(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Minimal header for admin — no public branding */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Panel de Administrador</h1>
            <p className="text-gray-400 text-sm">Iglesia Adventista UNADECA</p>
          </div>
          {isAuth && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-400 transition"
            >
              Cerrar sesion
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {!authChecked ? (
            <div className="text-center py-12 text-gray-500">Verificando...</div>
          ) : isAuth ? (
            <MicrophoneSetup />
          ) : (
            <AdminLogin onAuthenticated={() => setIsAuth(true)} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
