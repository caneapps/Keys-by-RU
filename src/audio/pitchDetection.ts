/**
 * Real-time microphone pitch detection engine for acoustic and digital pianos.
 * Specifically tuned for iOS Safari / Web Audio with musical instrument constraints,
 * time-domain autocorrelation, sub-sample parabolic interpolation,
 * adjustable noise-gate threshold, and consecutive-frame pitch stability filtering.
 * British English spelling conventions used throughout.
 */

import { midiToNote } from '../utils/musicLogic.ts';

export interface PitchDetectionResult {
  frequency: number; // Hz (e.g. 440.0)
  midi: number; // MIDI note number (e.g. 69 for A4)
  note: string; // Note name (e.g. "C4", "F#4")
  confidence: number; // 0.0 to 1.0 (0-100%)
  centsOff: number; // -50 to +50 cents deviation
  rms: number; // Raw root-mean-square amplitude (0 to 1)
}

export interface NoteTriggerEvent {
  midi: number;
  note: string;
  velocity: number;
  confidence: number;
  centsOff: number;
  source: 'mic';
}

export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening: boolean = false;
  private rafId: number | null = null;

  // Calibration & Gate
  private noiseGateThreshold: number = 0.016; // Default noise-gate floor
  private minConfidence: number = 0.65; // Minimum confidence to accept pitch
  private smoothedAudioLevel: number = 0; // Smoothed 0-1 for live visual meter

  // Pitch Stability Filter (filters out brief ambient clicks/transients)
  private candidateMidi: number | null = null;
  private stableFramesCount: number = 0;
  private readonly REQUIRED_STABLE_FRAMES: number = 2; // 2-3 consecutive frames

  // Note-On Debounce / State
  private activeTriggeredMidi: number | null = null;
  private lastSoundTimestamp: number = 0;
  private readonly NOTE_OFF_SILENCE_MS: number = 160; // Silence required to re-trigger same note

  // Callbacks
  private onPitchUpdateCallback: ((result: PitchDetectionResult | null, audioLevel: number) => void) | null = null;
  private onNoteTriggeredCallback: ((event: NoteTriggerEvent) => void) | null = null;

  /**
   * Starts listening to the microphone with musical instrument constraints for iOS.
   */
  async startListening(
    onPitchUpdate?: (result: PitchDetectionResult | null, audioLevel: number) => void,
    onNoteTriggered?: (event: NoteTriggerEvent) => void
  ): Promise<boolean> {
    if (this.isListening) {
      if (onPitchUpdate) this.onPitchUpdateCallback = onPitchUpdate;
      if (onNoteTriggered) this.onNoteTriggeredCallback = onNoteTriggered;
      return true;
    }

    this.onPitchUpdateCallback = onPitchUpdate || null;
    this.onNoteTriggeredCallback = onNoteTriggered || null;

    try {
      // Audio constraints specifically configured for musical instruments on iOS Safari & Chrome:
      // Disabling echoCancellation, noiseSuppression, and autoGainControl ensures sustained piano resonance
      // and natural harmonic overtones are not attenuated as "noise".
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          channelCount: 1,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      // 2048/4096 gives high resolution across lower piano registers
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.1;
      source.connect(this.analyser);

      this.isListening = true;
      this.candidateMidi = null;
      this.stableFramesCount = 0;
      this.activeTriggeredMidi = null;
      this.smoothedAudioLevel = 0;

      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      this.stopListening();
      return false;
    }
  }

  /**
   * Stops microphone input and cleans up audio hardware resources.
   */
  stopListening() {
    this.isListening = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.candidateMidi = null;
    this.stableFramesCount = 0;
    this.activeTriggeredMidi = null;
    this.smoothedAudioLevel = 0;

    if (this.onPitchUpdateCallback) {
      this.onPitchUpdateCallback(null, 0);
    }
  }

  /**
   * Sets the noise-gate threshold (from 0.005 sensitive to 0.08 loud environment).
   */
  setNoiseGateThreshold(threshold: number) {
    this.noiseGateThreshold = Math.max(0.003, Math.min(0.12, threshold));
  }

  getNoiseGateThreshold(): number {
    return this.noiseGateThreshold;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  private detectLoop = () => {
    if (!this.isListening || !this.analyser || !this.audioContext) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const result = this.processAudioFrame(buffer, this.audioContext.sampleRate);

    // Audio level meter smoothing
    const rawRms = result ? result.rms : this.calculateRms(buffer);
    this.smoothedAudioLevel = Math.max(rawRms, this.smoothedAudioLevel * 0.82);

    // Send continuous pitch and level updates to UI
    if (this.onPitchUpdateCallback) {
      this.onPitchUpdateCallback(result, this.smoothedAudioLevel);
    }

    // Stability filtering & discrete noteOn trigger logic
    const now = performance.now();
    if (result && result.confidence >= this.minConfidence) {
      this.lastSoundTimestamp = now;

      if (this.candidateMidi === result.midi) {
        this.stableFramesCount += 1;
      } else {
        this.candidateMidi = result.midi;
        this.stableFramesCount = 1;
      }

      // Check if candidate note reached stability threshold
      if (this.stableFramesCount >= this.REQUIRED_STABLE_FRAMES) {
        if (this.activeTriggeredMidi !== result.midi) {
          this.activeTriggeredMidi = result.midi;

          // Velocity estimated from RMS amplitude relative to noise gate
          const normalizedVel = Math.min(1.0, Math.max(0.4, (result.rms / 0.15)));

          if (this.onNoteTriggeredCallback) {
            this.onNoteTriggeredCallback({
              midi: result.midi,
              note: result.note,
              velocity: normalizedVel,
              confidence: result.confidence,
              centsOff: result.centsOff,
              source: 'mic',
            });
          }
        }
      }
    } else {
      // Below noise-gate or low confidence
      if (now - this.lastSoundTimestamp > this.NOTE_OFF_SILENCE_MS) {
        this.activeTriggeredMidi = null;
        this.candidateMidi = null;
        this.stableFramesCount = 0;
      }
    }

    this.rafId = requestAnimationFrame(this.detectLoop);
  };

  private calculateRms(buf: Float32Array): number {
    const SIZE = buf.length;
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
      const v = buf[i];
      sum += v * v;
    }
    return Math.sqrt(sum / SIZE);
  }

  /**
   * Time-domain autocorrelation pitch detector with zero-crossing alignment
   * and parabolic peak interpolation.
   */
  private processAudioFrame(buf: Float32Array, sampleRate: number): PitchDetectionResult | null {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Noise-gate threshold test: block ambient room rumble
    if (rms < this.noiseGateThreshold) {
      return null;
    }

    // Find initial zero crossings to avoid edge discontinuity
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.15;

    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    const N = trimmed.length;
    if (N < 256) return null;

    // Autocorrelation buffer
    const c = new Float32Array(N).fill(0);

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) {
        c[i] += trimmed[j] * trimmed[j + i];
      }
    }

    // Walk past the initial peak at lag 0
    let d = 0;
    while (d < N - 1 && c[d] > c[d + 1]) {
      d++;
    }

    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < N; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 <= 0 || T0 >= N - 1) return null;

    // Sub-sample parabolic interpolation for accurate Hertz calculation
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a !== 0) {
      T0 = T0 - b / (2 * a);
    }

    const frequency = sampleRate / T0;

    // Human piano fundamental pitch range: A0 (27.5 Hz) to C8 (4186 Hz)
    if (frequency < 27.0 || frequency > 4250.0) {
      return null;
    }

    // Convert frequency in Hz to fractional MIDI pitch: 69 + 12 * log2(f / 440)
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midiRound = Math.round(midiFloat);
    const centsOff = Math.round((midiFloat - midiRound) * 100);

    // Confidence metric: ratio of autocorrelation peak to zero-lag energy
    const rawRatio = c[0] > 0 ? (maxval / c[0]) : 0;
    const confidence = Math.min(1.0, Math.max(0.0, rawRatio * 1.25));

    if (confidence < 0.55) {
      return null;
    }

    const note = midiToNote(midiRound);

    return {
      frequency: Math.round(frequency * 10) / 10,
      midi: midiRound,
      note,
      confidence,
      centsOff,
      rms,
    };
  }
}

export const pitchDetector = new PitchDetector();

