import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Alert } from '../Common/Alert';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { AudioLevelMonitor } from './AudioLevelMonitor';
import { useAudioCapture } from '../../hooks/useAudioCapture';
import { useSonioxSession } from '../../hooks/useSonioxSession';

export const MicrophoneSetup: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  const {
    audioDevices,
    selectedDevice,
    audioLevel,
    isInitialized,
    error: audioError,
    initializeAudio,
    startCapture,
    stopCapture,
    switchDevice,
    loadAudioDevices,
  } = useAudioCapture();

  const {
    isConnected,
    isLoading: sonioxLoading,
    error: sonioxError,
    connect: connectSoniox,
    sendAudio,
    finish: finishSoniox,
    disconnect: disconnectSoniox,
  } = useSonioxSession();

  const handleStartBroadcast = async () => {
    try {
      setIsStarting(true);

      // 1. Init mic if not already done
      if (!isInitialized) {
        await initializeAudio(selectedDevice?.deviceId);
      }

      // 2. Get temp key + open WebSocket to Soniox
      await connectSoniox('es', 'en');

      // 3. Start streaming mic audio into the WebSocket
      startCapture((pcmInt16: Int16Array) => {
        sendAudio(pcmInt16);
      });

      setIsRecordingActive(true);
    } catch (error) {
      console.error('Failed to start broadcast:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBroadcast = async () => {
    try {
      // Stop mic
      stopCapture();

      // Signal end-of-audio so Soniox can finalize remaining tokens
      finishSoniox();

      // After a short delay, hard disconnect
      setTimeout(() => disconnectSoniox(), 2000);

      setIsRecordingActive(false);
    } catch (error) {
      console.error('Failed to stop broadcast:', error);
    }
  };

  const handleDeviceSwitch = async (device: any) => {
    try {
      await switchDevice(device);
    } catch (error) {
      console.error('Failed to switch device:', error);
    }
  };

  const errorMessage = audioError || sonioxError;

  return (
    <div className="space-y-6">
      {/* Status Panel */}
      <Card padding="lg">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Estado de la Transmision</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatusIndicator label="Audio" active={isInitialized} />
            <StatusIndicator label="Soniox" active={isConnected} />
            <StatusIndicator label="Grabando" active={isRecordingActive} />
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {errorMessage && (
        <Alert type="error" message={errorMessage} />
      )}

      {/* Control Buttons */}
      <Card padding="lg">
        <div className="flex gap-3">
          <Button
            variant={isRecordingActive ? 'danger' : 'success'}
            size="lg"
            onClick={isRecordingActive ? handleStopBroadcast : handleStartBroadcast}
            isLoading={isStarting || sonioxLoading}
            className="flex-1"
          >
            {isRecordingActive ? 'Detener Transmision' : 'Iniciar Transmision'}
          </Button>

          <Button variant="secondary" size="lg" onClick={loadAudioDevices} className="flex-1">
            Actualizar
          </Button>
        </div>
      </Card>

      {/* Audio Device Selector */}
      <AudioDeviceSelector
        devices={audioDevices}
        selectedDevice={selectedDevice}
        onDeviceSelect={handleDeviceSwitch}
        onRefresh={loadAudioDevices}
      />

      {/* Audio Level Monitor */}
      <AudioLevelMonitor audioLevel={audioLevel} isRecording={isRecordingActive} />
    </div>
  );
};

/* Small helper component */
function StatusIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`p-4 rounded-lg text-center ${active ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-lg font-bold ${active ? 'text-green-600' : 'text-gray-400'}`}>
        {active ? '✓' : '○'}
      </p>
    </div>
  );
}
