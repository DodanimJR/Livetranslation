import React, { useState, useEffect } from 'react';
import { Card } from '@components/Common/Card';
import { Button } from '@components/Common/Button';
import { Alert } from '@components/Common/Alert';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { AudioLevelMonitor } from './AudioLevelMonitor';
import { useAudioCapture } from '@hooks/useAudioCapture';
import { useSonioxSession } from '@hooks/useSonioxSession';

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
    sessionId,
    isConnected,
    isLoading: sonioxLoading,
    error: sonioxError,
    createSession,
    connectSession,
    sendAudioData,
    endSession,
  } = useSonioxSession();

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio(selectedDevice?.deviceId);
  }, []);

  const handleStartBroadcast = async () => {
    try {
      setIsStarting(true);

      // Create Soniox session
      const newSessionId = await createSession();

      // Connect to Soniox
      await connectSession(newSessionId);

      // Start audio capture with Soniox callback
      startCapture((audioData) => {
        if (isConnected) {
          sendAudioData(audioData);
        }
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
      stopCapture();
      await endSession();
      setIsRecordingActive(false);
    } catch (error) {
      console.error('Failed to stop broadcast:', error);
    }
  };

  const handleDeviceSwitch = async (device: any) => {
    try {
      await switchDevice(device);
      if (isRecordingActive) {
        // Restart recording with new device
        stopCapture();
        await initializeAudio(device.deviceId);
        startCapture((audioData) => {
          sendAudioData(audioData);
        });
      }
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
          <h3 className="text-lg font-semibold text-gray-900">Estado de la Transmisión</h3>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className={`p-4 rounded-lg text-center ${isInitialized ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className="text-xs text-gray-600 mb-1">Audio</p>
              <p className={`text-lg font-bold ${isInitialized ? 'text-green-600' : 'text-gray-600'}`}>
                {isInitialized ? '✓' : '○'}
              </p>
            </div>

            <div className={`p-4 rounded-lg text-center ${isConnected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className="text-xs text-gray-600 mb-1">Soniox</p>
              <p className={`text-lg font-bold ${isConnected ? 'text-green-600' : 'text-gray-600'}`}>
                {isConnected ? '✓' : '○'}
              </p>
            </div>

            <div className={`p-4 rounded-lg text-center ${isRecordingActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className="text-xs text-gray-600 mb-1">Grabando</p>
              <p className={`text-lg font-bold ${isRecordingActive ? 'text-green-600' : 'text-gray-600'}`}>
                {isRecordingActive ? '✓' : '○'}
              </p>
            </div>

            <div className={`p-4 rounded-lg text-center ${sessionId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className="text-xs text-gray-600 mb-1">Sesión</p>
              <p className={`text-xs font-mono ${sessionId ? 'text-blue-600' : 'text-gray-600'}`}>
                {sessionId ? sessionId.slice(0, 8) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {errorMessage && (
        <Alert
          type="error"
          message={errorMessage}
          onClose={() => window.location.reload()}
        />
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
            {isRecordingActive ? '⏹ Detener Transmisión' : '🎙 Iniciar Transmisión'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={loadAudioDevices}
            className="flex-1"
          >
            🔄 Actualizar
          </Button>
        </div>
      </Card>

      {/* Audio Device Selector */}
      <AudioDeviceSelector
        devices={audioDevices}
        selectedDevice={selectedDevice}
        onDeviceSelect={handleDeviceSwitch}
        onRefresh={loadAudioDevices}
        isLoading={false}
      />

      {/* Audio Level Monitor */}
      <AudioLevelMonitor audioLevel={audioLevel} isRecording={isRecordingActive} />
    </div>
  );
};
