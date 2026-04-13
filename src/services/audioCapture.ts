import type { AudioDevice, AudioLevelData } from '../types/index';

const TARGET_SAMPLE_RATE = 16000;

export class AudioCaptureService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isInitialized = false;
  private audioCallback: ((pcm: Int16Array) => void) | null = null;
  private levelCallback: ((level: AudioLevelData) => void) | null = null;
  private levelInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get all available audio input devices.
   */
  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'audioinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${i + 1}`,
        kind: 'audioinput' as const,
        groupId: d.groupId,
      }));
  }

  /**
   * Initialize: get mic stream + set up AudioContext.
   *
   * We use the browser's native sample rate for the AudioContext
   * (forcing 16kHz can cause ScriptProcessor to never fire on some
   * browsers). Instead we downsample in software when handing off
   * audio to the callback.
   */
  async initialize(deviceId?: string): Promise<void> {
    if (this.isInitialized) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Use default sample rate (usually 44100 or 48000) – we downsample later
    this.audioContext = new AudioContext();
    // Ensure the context is running (Chrome suspends until user gesture)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const nativeSampleRate = this.audioContext.sampleRate;
    console.log(`AudioContext created at ${nativeSampleRate} Hz`);

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Analyser for level monitoring
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // ScriptProcessor to capture raw PCM
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.audioCallback) return;

      const inputFloat32 = e.inputBuffer.getChannelData(0);

      // Downsample from native rate to 16 kHz
      const downsampled = this.downsample(inputFloat32, nativeSampleRate, TARGET_SAMPLE_RATE);

      // Convert to Int16 PCM
      const int16 = this.float32ToInt16(downsampled);
      this.audioCallback(int16);
    };

    source.connect(this.processor);
    // Connect to a silent destination so onaudioprocess fires.
    // We don't want to play mic audio through speakers (feedback!),
    // so we use a GainNode set to 0.
    const silentGain = this.audioContext.createGain();
    silentGain.gain.value = 0;
    this.processor.connect(silentGain);
    silentGain.connect(this.audioContext.destination);

    this.isInitialized = true;
    console.log('AudioCaptureService initialized');
  }

  /**
   * Start sending audio to the callback + start level monitoring.
   */
  start(callback: (pcm: Int16Array) => void): void {
    if (!this.isInitialized) throw new Error('Call initialize() first');
    this.audioCallback = callback;
    console.log('AudioCaptureService: streaming started');

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    // Start level monitor regardless of when onLevelUpdate was called
    this.startLevelMonitor();
  }

  /**
   * Stop capturing and release all resources.
   */
  stop(): void {
    this.audioCallback = null;
    this.stopLevelMonitor();

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.isInitialized = false;
    console.log('AudioCaptureService: stopped');
  }

  /**
   * Register a callback for audio level updates (~10 Hz).
   * Can be called before or after start().
   */
  onLevelUpdate(callback: (level: AudioLevelData) => void): void {
    this.levelCallback = callback;
  }

  async switchAudioDevice(deviceId: string): Promise<void> {
    this.stop();
    await this.initialize(deviceId);
  }

  isActive(): boolean {
    return this.isInitialized && this.audioCallback !== null;
  }

  // ── private helpers ───────────────────────────────────────

  private startLevelMonitor(): void {
    this.stopLevelMonitor();
    if (!this.analyser) return;

    const bufLen = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);

    this.levelInterval = setInterval(() => {
      if (!this.analyser || !this.levelCallback) return;

      this.analyser.getByteTimeDomainData(dataArray);

      // Compute RMS from waveform data (centered at 128)
      let sum = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = (dataArray[i] - 128) / 128; // normalize to [-1, 1]
        sum += v * v;
      }
      const rms = Math.sqrt(sum / bufLen);
      const level = Math.min(100, Math.round(rms * 300)); // scale up for visibility

      this.levelCallback({
        current: level,
        peak: 100,
        rms: rms * 100,
        timestamp: Date.now(),
      });
    }, 80); // ~12 fps
  }

  private stopLevelMonitor(): void {
    if (this.levelInterval) {
      clearInterval(this.levelInterval);
      this.levelInterval = null;
    }
  }

  /**
   * Downsample Float32 audio from `fromRate` to `toRate`.
   * Simple linear interpolation.
   */
  private downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return buffer;

    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const lower = Math.floor(srcIndex);
      const upper = Math.min(lower + 1, buffer.length - 1);
      const frac = srcIndex - lower;
      result[i] = buffer[lower] * (1 - frac) + buffer[upper] * frac;
    }

    return result;
  }

  /**
   * Convert Float32 [-1, 1] to Int16 PCM.
   */
  private float32ToInt16(f32: Float32Array): Int16Array {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return i16;
  }
}

export const audioCaptureService = new AudioCaptureService();
