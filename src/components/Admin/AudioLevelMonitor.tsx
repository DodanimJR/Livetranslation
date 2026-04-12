import React from 'react';
import { Card } from '../Common/Card';
import type { AudioLevelData } from '../../types/index';

interface AudioLevelMonitorProps {
  audioLevel: AudioLevelData | null;
  isRecording: boolean;
}

export const AudioLevelMonitor: React.FC<AudioLevelMonitorProps> = ({
  audioLevel,
  isRecording,
}) => {
  const currentLevel = audioLevel?.current || 0;
  const rmsLevel = audioLevel?.rms || 0;

  // Determine color based on level
  const getColorClass = (level: number) => {
    if (level < 30) return 'bg-green-500';
    if (level < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (level: number) => {
    if (level < 20) return 'Muy bajo';
    if (level < 40) return 'Bajo';
    if (level < 70) return 'Normal';
    if (level < 85) return 'Alto';
    return 'Muy alto';
  };

  return (
    <Card title="Monitor de Nivel de Audio" padding="lg">
      <div className="space-y-6">
        {!isRecording ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm">Inicia la grabación para ver los niveles de audio</p>
          </div>
        ) : (
          <>
            {/* Real-time Level Meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">Nivel Actual</label>
                <span className="text-sm font-mono text-gray-600">{Math.round(currentLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${getColorClass(currentLevel)}`}
                  style={{ width: `${Math.min(currentLevel, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{getStatusText(currentLevel)}</p>
            </div>

            {/* RMS Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">RMS Level</label>
                <span className="text-sm font-mono text-gray-600">{Math.round(rmsLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${getColorClass(rmsLevel)}`}
                  style={{ width: `${Math.min(rmsLevel, 100)}%` }}
                />
              </div>
            </div>

            {/* Status Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-blue-900 font-medium">Grabando en vivo</span>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-semibold mb-2">💡 Consejos:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Mantén el nivel entre 40-70% para mejor calidad</li>
                <li>• Evita picos ruidosos (niveles &gt; 85%)</li>
                <li>• Asegúrate de que el micrófono está cerca del orador</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
