import type { AudioDevice, AudioLevelData } from '../types/index.js';
import { audioConfig } from './config.js';

export class AudioCaptureService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private isInitialized = false;
  private audioCallback: ((data: Float32Array) => void) | null = null;
  private levelCallback: ((level: AudioLevelData) => void) | null = null;

  /**
   * Initialize Web Audio API and get media stream from selected device
   */
  async initialize(deviceId?: string): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('Audio capture already initialized');
        return;
      }

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: audioConfig.echoCancellation,
          noiseSuppression: audioConfig.noiseSuppression,
          autoGainControl: audioConfig.autoGainControl,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser for level monitoring
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      // Create script processor for audio data
      this.processor = this.audioContext.createScriptProcessor(
        audioConfig.bufferSize,
        audioConfig.channelCount,
        audioConfig.channelCount
      );

      // Connect nodes
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Initialize data array for level monitoring
      const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
      this.dataArray = new Uint8Array(buffer);

      // Set up audio processing callback
      this.processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const audioData = new Float32Array(inputData);
        
        if (this.audioCallback) {
          this.audioCallback(audioData);
        }

        // Update audio levels
        this.updateAudioLevel();
      };

      this.isInitialized = true;
      console.log('Audio capture initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize audio capture: ${errorMessage}`);
    }
  }

  /**
   * Get all available audio input devices
   */
  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === 'audioinput');

      return audioInputs.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${audioInputs.indexOf(device) + 1}`,
        kind: 'audioinput',
        groupId: device.groupId,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to enumerate audio devices: ${errorMessage}`);
    }
  }

  /**
   * Change the active audio device
   */
  async switchAudioDevice(deviceId: string): Promise<void> {
    try {
      // Stop current stream
      this.stop();

      // Re-initialize with new device
      await this.initialize(deviceId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to switch audio device: ${errorMessage}`);
    }
  }

  /**
   * Start capturing audio
   */
  start(audioCallback: (data: Float32Array) => void): void {
    if (!this.isInitialized) {
      throw new Error('Audio capture not initialized. Call initialize() first.');
    }

    this.audioCallback = audioCallback;

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    console.log('Audio capture started');
  }

  /**
   * Stop capturing audio
   */
  stop(): void {
    this.audioCallback = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.processor = null;
    this.dataArray = null;
    this.isInitialized = false;

    console.log('Audio capture stopped');
  }

  /**
   * Register callback for audio level updates
   */
  onLevelUpdate(callback: (level: AudioLevelData) => void): void {
    this.levelCallback = callback;
  }

  /**
   * Update and emit audio level data
   */
  private updateAudioLevel(): void {
    if (!this.analyser || !this.dataArray || !this.levelCallback) {
      return;
    }

    try {
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate RMS (Root Mean Square) for more accurate level
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const normalized = this.dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);

      // Normalize to 0-100 range
      const levelValue = Math.round(rms * 100);
      
      this.levelCallback({
        current: levelValue,
        peak: 100, // Could track peak separately if needed
        rms: rms * 100,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error updating audio level:', error);
    }
  }

  /**
   * Check if audio capture is active
   */
  isActive(): boolean {
    return this.isInitialized && this.audioCallback !== null;
  }

  /**
   * Get current audio context sample rate
   */
  getSampleRate(): number {
    return this.audioContext?.sampleRate || audioConfig.sampleRate;
  }
}

// Export singleton instance
export const audioCaptureService = new AudioCaptureService();
