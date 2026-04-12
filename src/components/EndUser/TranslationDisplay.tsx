import React from 'react';
import { Card } from '../Common/Card';
import type { TranslationSegment } from '../../types/index';

interface TranslationDisplayProps {
  translations: TranslationSegment[];
  targetLanguage: string;
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  translations,
  targetLanguage,
}) => {
  const languageNames: Record<string, string> = {
    es: 'Español',
    en: 'Inglés',
    fr: 'Francés',
    pt: 'Portugués',
    de: 'Alemán',
  };

  const latestTranslation = translations.length > 0 ? translations[translations.length - 1] : null;

  return (
    <Card title={`Traducción: ${languageNames[targetLanguage] || targetLanguage}`} padding="lg">
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
          {latestTranslation ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">Traducción más reciente:</p>
              <p className="text-xl text-gray-900 font-medium leading-relaxed">
                {latestTranslation.translatedText}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(latestTranslation.timestamp).toLocaleTimeString('es-ES')}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Esperando traducción...</p>
          )}
        </div>

        {translations.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Historial</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {translations.slice(-5).reverse().map((translation) => (
                <div key={translation.id} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-900">{translation.translatedText}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(translation.timestamp).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
