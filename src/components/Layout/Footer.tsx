import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Como funciona este servicio de traduccion en vivo?',
      answer:
        'Este servicio utiliza inteligencia artificial de Soniox, un servicio externo especializado en reconocimiento de voz, para transcribir y traducir en tiempo real lo que se dice durante los servicios de la iglesia. El audio se procesa de forma segura y el resultado se muestra al instante en su pantalla.',
    },
    {
      question: 'Cual es el proposito de esta plataforma?',
      answer:
        'El proposito es ayudar a nuestra comunidad a superar las barreras del idioma. Queremos que todos los miembros y visitantes puedan seguir y comprender los servicios de la iglesia, sin importar el idioma que hablen, fortaleciendo asi nuestra comunidad.',
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3">Iglesia Adventista UNADECA</h3>
            <p className="text-sm text-gray-400">
              Transmision en vivo de servicios religiosos con transcripcion y traduccion en tiempo real.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Preguntas Frecuentes</h4>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="text-sm text-left w-full hover:text-white transition flex items-start gap-2"
                  >
                    <span className="text-gray-500 flex-shrink-0 mt-0.5">
                      {faqOpen === i ? '−' : '+'}
                    </span>
                    <span>{faq.question}</span>
                  </button>
                  {faqOpen === i && (
                    <p className="text-xs text-gray-400 mt-2 ml-5 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Estado del Sistema</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Sistema Operativo</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400 space-y-2">
          <p>&copy; {currentYear} Iglesia Adventista UNADECA. Todos los derechos reservados.</p>
          <p className="text-gray-500">
            Desarrollado por{' '}
            <a
              href="https://github.com/DodanimJR"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition underline underline-offset-2"
            >
              DodanimJR
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
