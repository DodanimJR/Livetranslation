import React, { useState } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Alert } from '../Common/Alert';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { AudioLevelMonitor } from './AudioLevelMonitor';
import { useAudioCapture } from '../../hooks/useAudioCapture';
import { useSonioxSession } from '../../hooks/useSonioxSession';
import { useTranscriptStore } from '../../context/transcriptStore';
import { sonioxService } from '../../services/soniox';
import { audioCaptureService } from '../../services/audioCapture';
import axios from 'axios';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';

export const MicrophoneSetup: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);

  // isRecording lives in the global store so it survives tab switches
  const { isRecording, setRecording } = useTranscriptStore();

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

      if (!isInitialized) {
        await initializeAudio(selectedDevice?.deviceId);
      }

      await connectSoniox('es', 'en');

      audioCaptureService.start((pcmInt16: Int16Array) => {
        sonioxService.sendAudio(pcmInt16);
      });

      setRecording(true);

      // Tell viewers the session is live
      axios.post(`${BACKEND_API_URL}/broadcast/status`, { isLive: true }).catch(() => {});
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
      setRecording(false);

      // Tell viewers the session ended
      axios.post(`${BACKEND_API_URL}/broadcast/status`, { isLive: false }).catch(() => {});
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
            <StatusIndicator label="Grabando" active={isRecording} />
          </div>
        </div>
      </Card>

      {errorMessage && <Alert type="error" message={errorMessage} />}

      {/* Control Buttons */}
      <Card padding="lg">
        <div className="flex gap-3">
          <Button
            variant={isRecording ? 'danger' : 'success'}
            size="lg"
            onClick={isRecording ? handleStopBroadcast : handleStartBroadcast}
            isLoading={isStarting || sonioxLoading}
            className="flex-1"
          >
            {isRecording ? 'Detener Transmision' : 'Iniciar Transmision'}
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

      <AudioLevelMonitor audioLevel={audioLevel} isRecording={isRecording} />
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
