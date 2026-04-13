import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Alert } from '../Common/Alert';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { AudioLevelMonitor } from './AudioLevelMonitor';
import { useAudioCapture } from '../../hooks/useAudioCapture';
import { useSonioxSession } from '../../hooks/useSonioxSession';
import { sonioxService } from '../../services/soniox';
import { audioCaptureService } from '../../services/audioCapture';

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
    stopCapture,
    switchDevice,
    loadAudioDevices,
  } = useAudioCapture();

  const {
    isConnected,
    isLoading: sonioxLoading,
    error: sonioxError,
    connect: connectSoniox,
    finish: finishSoniox,
    disconnect: disconnectSoniox,
  } = useSonioxSession();

  const handleStartBroadcast = async () => {
    try {
      setIsStarting(true);

      // 1. Init mic (no-ops if already initialized)
      await initializeAudio(selectedDevice?.deviceId);

      // 2. Get temp key + open WebSocket to Soniox
      await connectSoniox('es', 'en');

      // 3. Start streaming mic audio directly into the WebSocket.
      //    We call the singleton services directly to avoid any
      //    stale closure issues with React hooks.
      audioCaptureService.start((pcmInt16: Int16Array) => {
        sonioxService.sendAudio(pcmInt16);
      });

      setIsRecordingActive(true);
    } catch (error) {
      console.error('Failed to start broadcast:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBroadcast = () => {
    try {
      stopCapture();
      finishSoniox();
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

      {errorMessage && <Alert type="error" message={errorMessage} />}

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

      <AudioDeviceSelector
        devices={audioDevices}
        selectedDevice={selectedDevice}
        onDeviceSelect={handleDeviceSwitch}
        onRefresh={loadAudioDevices}
      />

      <AudioLevelMonitor audioLevel={audioLevel} isRecording={isRecordingActive} />
    </div>
  );
};

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
