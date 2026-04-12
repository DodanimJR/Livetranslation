import { useCallback, useEffect, useState } from 'react';
import { audioCaptureService } from '../services/audioCapture';
import type { AudioDevice, AudioLevelData } from '../types/index';

export const useAudioCapture = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AudioDevice | null>(null);
  const [audioLevel, setAudioLevel] = useState<AudioLevelData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available audio devices
  const loadAudioDevices = useCallback(async () => {
    try {
      const devices = await audioCaptureService.getAudioDevices();
      setAudioDevices(devices);
      
      if (devices.length > 0 && !selectedDevice) {
        setSelectedDevice(devices[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [selectedDevice]);

  // Initialize audio capture
  const initializeAudio = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      await audioCaptureService.initialize(deviceId);
      
      // Set up level monitoring
      audioCaptureService.onLevelUpdate((level) => {
        setAudioLevel(level);
      });

      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

  // Start capturing audio
  const startCapture = useCallback((audioCallback: (data: Float32Array) => void) => {
    try {
      if (!isInitialized) {
        throw new Error('Audio capture not initialized');
      }
      audioCaptureService.start(audioCallback);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, [isInitialized]);

  // Stop capturing audio
  const stopCapture = useCallback(() => {
    try {
      audioCaptureService.stop();
      setIsInitialized(false);
      setAudioLevel(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

  // Switch audio device
  const switchDevice = useCallback(async (device: AudioDevice) => {
    try {
      setError(null);
      await audioCaptureService.switchAudioDevice(device.deviceId);
      setSelectedDevice(device);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

  // Load devices on mount
  useEffect(() => {
    loadAudioDevices();
  }, [loadAudioDevices]);

  return {
    audioDevices,
    selectedDevice,
    audioLevel,
    isInitialized,
    error,
    loadAudioDevices,
    initializeAudio,
    startCapture,
    stopCapture,
    switchDevice,
  };
};
