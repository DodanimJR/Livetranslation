import React from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import type { AudioDevice } from '../../types/index';

interface AudioDeviceSelectorProps {
  devices: AudioDevice[];
  selectedDevice: AudioDevice | null;
  onDeviceSelect: (device: AudioDevice) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  devices,
  selectedDevice,
  onDeviceSelect,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <Card title="Selecciona un Dispositivo de Audio" padding="lg">
      <div className="space-y-4">
        {devices.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              No se detectaron dispositivos de audio. Por favor, conecta un micrófono.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => onDeviceSelect(device)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedDevice?.deviceId === device.deviceId
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">🎤</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{device.label}</p>
                    <p className="text-xs text-gray-500">{device.deviceId}</p>
                  </div>
                  {selectedDevice?.deviceId === device.deviceId && (
                    <div className="text-blue-600 text-xl">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          size="md"
          onClick={onRefresh}
          isLoading={isLoading}
          className="w-full"
        >
          🔄 Actualizar Dispositivos
        </Button>
      </div>
    </Card>
  );
};
