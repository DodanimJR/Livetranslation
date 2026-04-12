import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">Iglesia Adventista UNADECA</h3>
            <p className="text-sm text-gray-400">Transmisión en vivo de servicios religiosos con transcripción y traducción en tiempo real.</p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-3">Ayuda Rápida</h4>
            <ul className="text-sm space-y-2">
              <li><a href="#" className="hover:text-white transition">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-white transition">Soporte Técnico</a></li>
              <li><a href="#" className="hover:text-white transition">Configuración</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Estado del Sistema</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Sistema Operativo</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Iglesia Adventista UNADECA. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
