/**
 * Microphone pitch detection module for real acoustic/digital pianos.
 * Uses Yin/Autocorrelation pitch tracking on the Web Audio API input stream
 * with confidence estimation and frequency-to-pitch mapping.
 */

import { midiToNote } from '../utils/musicLogic.ts';

export interface PitchDetectionResult {
  frequency: number;
  note: string;
  confidence: number; // 0 to 1
  centsOff: number;
}

export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening: boolean = false;
  private rafId: number | null = null;
  private onPitchCallback: ((result: PitchDetectionResult | null) => void) | null = null;

  async startListening(callback: (result: PitchDetectionResult | null) => void): Promise<boolean> {
    this.onPitchCallback = callback;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      this.isListening = true;
      this.detectLoop();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      return false;
    }
  }

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
    if (this.onPitchCallback) {
      this.onPitchCallback(null);
    }
  }

  private detectLoop = () => {
    if (!this.isListening || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const result = this.autoCorrelate(buffer, this.audioContext?.sampleRate || 44100);
    if (this.onPitchCallback) {
      this.onPitchCallback(result);
    }

    this.rafId = requestAnimationFrame(this.detectLoop);
  };

  private autoCorrelate(buf: Float32Array, sampleRate: number): PitchDetectionResult | null {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // If signal is too quiet (background noise floor)
    if (rms < 0.015) {
      return null;
    }

    // Trim edges to find zero crossings
    let r1 = 0;
    let r2 = SIZE - 1;
    const thres = 0.2;
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

    const trimmedBuf = buf.slice(r1, r2);
    const c = new Float32Array(trimmedBuf.length).fill(0);

    for (let i = 0; i < trimmedBuf.length; i++) {
      for (let j = 0; j < trimmedBuf.length - i; j++) {
        c[i] = c[i] + trimmedBuf[j] * trimmedBuf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmedBuf.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    if (T0 === 0) return null;

    // Parabolic interpolation for fine accuracy
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }

    const frequency = sampleRate / T0;
    // Human piano pitch range (A0 ~ 27.5Hz to C8 ~ 4186Hz)
    if (frequency < 27.5 || frequency > 4200) {
      return null;
    }

    // Convert frequency to MIDI number
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midiRound = Math.round(midiFloat);
    const centsOff = Math.round((midiFloat - midiRound) * 100);
    const confidence = Math.min(Math.max((c[maxpos] / c[0]) * 1.2, 0), 1);

    if (confidence < 0.6) return null;

    const note = midiToNote(midiRound);
    return {
      frequency: Math.round(frequency * 10) / 10,
      note,
      confidence,
      centsOff,
    };
  }
}

export const pitchDetector = new PitchDetector();
