import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Alert } from '../Common/Alert';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Por favor ingrese la contraseña.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${BACKEND_API_URL}/auth/login`, { password });

      if (res.data.success && res.data.data?.token) {
        sessionStorage.setItem('admin_token', res.data.data.token);
        onAuthenticated();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error de autenticacion.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <Card padding="lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Panel de Administrador</h2>
          <p className="text-gray-500 mt-2">Ingrese la contraseña para acceder</p>
        </div>

        {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            Ingresar
          </Button>
        </form>
      </Card>
    </div>
  );
};
