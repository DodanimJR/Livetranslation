import type { AudioDevice, AudioLevelData } from '../types/index';

const TARGET_SAMPLE_RATE = 16000;

export class AudioCaptureService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private audioCallback: ((pcm: Int16Array) => void) | null = null;
  private levelCallback: ((level: AudioLevelData) => void) | null = null;
  private levelInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get all available audio input devices.
   * Must be called after getUserMedia for labels to be populated.
   */
  async getAudioDevices(): Promise<AudioDevice[]> {
    // Need at least one getUserMedia call for labels to appear
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore - permissions may not be granted yet
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
   * Requesting 16 kHz sample rate so audio matches what Soniox expects.
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

    this.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Analyser for level monitoring
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);

    // ScriptProcessor to get raw PCM chunks
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(this.audioContext.destination); // required for onaudioprocess to fire

    processor.onaudioprocess = (e) => {
      if (!this.audioCallback) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = this.float32ToInt16(float32);
      this.audioCallback(int16);
    };

    this.isInitialized = true;
  }

  /**
   * Start sending audio to the callback.
   * Also starts the level monitor.
   */
  start(callback: (pcm: Int16Array) => void): void {
    if (!this.isInitialized) throw new Error('Call initialize() first');
    this.audioCallback = callback;

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    // Start periodic level updates
    if (this.analyser && this.levelCallback) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.levelInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const n = dataArray[i] / 255;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / dataArray.length) * 100;

        this.levelCallback!({
          current: Math.round(rms),
          peak: 100,
          rms,
          timestamp: Date.now(),
        });
      }, 100);
    }
  }

  /**
   * Stop capturing and release resources.
   */
  stop(): void {
    this.audioCallback = null;

    if (this.levelInterval) {
      clearInterval(this.levelInterval);
      this.levelInterval = null;
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
  }

  /**
   * Register a callback that receives audio level updates (~10 Hz).
   */
  onLevelUpdate(callback: (level: AudioLevelData) => void): void {
    this.levelCallback = callback;
  }

  /**
   * Switch to a different mic. Tears down & re-inits.
   */
  async switchAudioDevice(deviceId: string): Promise<void> {
    this.stop();
    await this.initialize(deviceId);
  }

  isActive(): boolean {
    return this.isInitialized && this.audioCallback !== null;
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
