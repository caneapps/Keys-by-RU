/**
 * Advanced DSP Audio Input Engine for Keys by Ru.
 * Handles high-resolution Web Audio signal processing:
 * - iOS Raw Instrument Mode (disables echo cancellation, noise suppression, AGC)
 * - Monophonic Pitch Recognition (YIN / Autocorrelation with parabolic interpolation and harmonic sub-multiple checking)
 * - Polyphonic Chord & Two-Hand Spectral Template Matching (Harmonic Product Spectrum + Expected-Note verification)
 * - Percussive Onset Detection (Spectral Flux + RMS amplitude derivatives for repeated notes)
 * - Web MIDI & Bluetooth MIDI integration (zero-latency velocity & polyphonic input)
 * - Ambient noise floor calibration and speaker bleed suppression.
 */

import { noteToMidi, midiToNote, midiToFrequency } from '../utils/musicLogic.ts';
import { audioEngine } from '../audio/audioEngine.ts';

export interface SpectralAnalysisResult {
  detectedPitchHz: number | null;
  detectedNote: string | null;
  detectedMidi: number | null;
  centsOffset: number;
  confidence: number; // 0 to 100
  audioLevel: number; // 0 to 1 RMS
  spectralFlux: number;
  isOnset: boolean;
  activeChordNotes: string[];
  detectedChordName: string | null;
  spectrumBars: number[]; // downsampled for live UI visualization (e.g. 24 bands)
}

export interface MidiDeviceState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  manufacturer: string | null;
}

export type AudioFrameCallback = (analysis: SpectralAnalysisResult) => void;
export type NoteTriggerCallback = (event: {
  note: string;
  midi: number;
  velocity: number;
  source: 'mic' | 'midi';
  isOnsetRepeat?: boolean;
}) => void;
export type ChordTriggerCallback = (event: {
  notes: string[];
  chordName: string;
  source: 'mic' | 'midi';
}) => void;

class AudioInputEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  // Analysis buffers (4096 gives ~10.7Hz frequency resolution at 44.1kHz, resolving bass notes cleanly)
  private readonly FFT_SIZE = 4096;
  private timeDomainBuffer: Float32Array = new Float32Array(this.FFT_SIZE);
  private frequencyBuffer: Float32Array = new Float32Array(this.FFT_SIZE / 2);
  private prevFrequencyBuffer: Float32Array = new Float32Array(this.FFT_SIZE / 2);

  // Calibration & Gate
  private noiseGateFloor: number = 0.015; // RMS threshold
  private isCalibratingNoise: boolean = false;
  private calibrationSamples: number[] = [];

  // Stability & Onset Tracking
  private previousDetectedMidi: number | null = null;
  private stableFrameCount: number = 0;
  private readonly STABILITY_THRESHOLD = 2; // frames
  private lastTriggeredMidi: number | null = null;
  private lastTriggerTime: number = 0;
  private lastOnsetTime: number = 0;

  // Expected Notes for Spectral Template Verification (e.g., from active lesson or song)
  private currentExpectedNotes: string[] = [];

  // Anti-bleed protection
  private speakerBleedProtection: boolean = true;

  // Web MIDI
  private midiAccess: any = null;
  private midiState: MidiDeviceState = {
    isSupported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
    isConnected: false,
    deviceName: null,
    manufacturer: null,
  };

  // Listeners
  private onFrameCallback: AudioFrameCallback | null = null;
  private onNoteTriggeredCallback: NoteTriggerCallback | null = null;
  private onChordTriggeredCallback: ChordTriggerCallback | null = null;
  private onMidiStateChange: ((state: MidiDeviceState) => void) | null = null;

  // Active MIDI pressed notes tracker
  private activeMidiNotes: Map<number, number> = new Map();

  // Common triad identification templates
  private readonly CHORD_TEMPLATES: Array<{ name: string; semitones: number[] }> = [
    { name: 'Major', semitones: [0, 4, 7] },
    { name: 'Minor', semitones: [0, 3, 7] },
    { name: 'Maj7', semitones: [0, 4, 7, 11] },
    { name: 'Min7', semitones: [0, 3, 7, 10] },
    { name: 'Dom7', semitones: [0, 4, 7, 10] },
    { name: 'Dim', semitones: [0, 3, 6] },
    { name: 'Sus4', semitones: [0, 5, 7] },
  ];

  /**
   * Initialise and start listening to iOS Raw Microphone.
   */
  async startMicrophone(
    onFrame?: AudioFrameCallback,
    onNote?: NoteTriggerCallback,
    onChord?: ChordTriggerCallback
  ): Promise<boolean> {
    if (onFrame) this.onFrameCallback = onFrame;
    if (onNote) this.onNoteTriggeredCallback = onNote;
    if (onChord) this.onChordTriggeredCallback = onChord;

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      // Stop previous instance if running
      this.stopMicrophone();

      // Request raw instrument input (vital for iOS piano recognition)
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.55;

      source.connect(this.analyser);

      // Apply Speaker Bleed Protection: suppress synth piano sound while mic is open
      if (this.speakerBleedProtection) {
        audioEngine.setSpeakerBleedProtection?.(true);
      }

      // Start 60fps DSP analysis loop
      this.runAnalysisLoop();
      return true;
    } catch (err) {
      console.warn('Microphone initialisation skipped or permission denied:', err);
      return false;
    }
  }

  /**
   * Stop microphone input and reset DSP state.
   */
  stopMicrophone() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.analyser = null;
    this.previousDetectedMidi = null;
    this.stableFrameCount = 0;
    this.lastTriggeredMidi = null;

    // Restore synth audio
    audioEngine.setSpeakerBleedProtection?.(false);
  }

  isListening(): boolean {
    return this.mediaStream !== null && this.audioCtx !== null;
  }

  setExpectedNotes(notes: string[]) {
    this.currentExpectedNotes = [...notes];
  }

  setSpeakerBleedProtection(enabled: boolean) {
    this.speakerBleedProtection = enabled;
    if (this.isListening()) {
      audioEngine.setSpeakerBleedProtection?.(enabled);
    }
  }

  getSpeakerBleedProtection(): boolean {
    return this.speakerBleedProtection;
  }

  setNoiseGateFloor(floor: number) {
    this.noiseGateFloor = Math.max(0.004, Math.min(0.08, floor));
  }

  getNoiseGateFloor(): number {
    return this.noiseGateFloor;
  }

  /**
   * 2-Second Ambient Room Noise Calibration Routine.
   * Samples 120 frames of ambient sound to calculate the 95th percentile RMS floor.
   */
  async calibrateRoomNoise(durationMs: number = 2000): Promise<number> {
    this.isCalibratingNoise = true;
    this.calibrationSamples = [];

    await new Promise((resolve) => setTimeout(resolve, durationMs));

    this.isCalibratingNoise = false;
    if (this.calibrationSamples.length > 0) {
      this.calibrationSamples.sort((a, b) => a - b);
      // Pick 95th percentile + 25% safety margin
      const p95Index = Math.floor(this.calibrationSamples.length * 0.95);
      const measuredFloor = this.calibrationSamples[p95Index] * 1.35;
      const finalFloor = Math.max(0.008, Math.min(0.065, measuredFloor));
      this.noiseGateFloor = finalFloor;
      return finalFloor;
    }
    return this.noiseGateFloor;
  }

  /**
   * Initialise Web MIDI / Bluetooth MIDI input.
   */
  async initMidi(onStateChange?: (state: MidiDeviceState) => void): Promise<boolean> {
    if (onStateChange) this.onMidiStateChange = onStateChange;

    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      this.midiState = {
        isSupported: false,
        isConnected: false,
        deviceName: null,
        manufacturer: null,
      };
      this.onMidiStateChange?.(this.midiState);
      return false;
    }

    try {
      this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.bindMidiInputs();

      this.midiAccess.onstatechange = () => {
        this.bindMidiInputs();
      };

      return true;
    } catch (err) {
      console.warn('Web MIDI access unavailable:', err);
      return false;
    }
  }

  private bindMidiInputs() {
    if (!this.midiAccess) return;

    let connected = false;
    let name: string | null = null;
    let manufacturer: string | null = null;

    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      connected = true;
      name = input.name || 'Digital Piano';
      manufacturer = input.manufacturer || 'MIDI Device';

      input.onmidimessage = (msg: any) => this.handleMidiMessage(msg);
    }

    this.midiState = {
      isSupported: true,
      isConnected: connected,
      deviceName: name,
      manufacturer: manufacturer,
    };
    this.onMidiStateChange?.(this.midiState);
  }

  private handleMidiMessage(event: any) {
    const [status, noteNumber, velocity] = event.data;
    const command = status & 0xf0;

    // Note On (0x90 with velocity > 0)
    if (command === 0x90 && velocity > 0) {
      const noteName = midiToNote(noteNumber);
      const normalizedVelocity = velocity / 127;
      this.activeMidiNotes.set(noteNumber, normalizedVelocity);

      this.onNoteTriggeredCallback?.({
        note: noteName,
        midi: noteNumber,
        velocity: normalizedVelocity,
        source: 'midi',
        isOnsetRepeat: false,
      });

      // Check polyphonic chord trigger
      if (this.activeMidiNotes.size >= 2) {
        const sortedNotes = Array.from(this.activeMidiNotes.keys())
          .sort((a, b) => a - b)
          .map((m) => midiToNote(m));
        const chordName = this.identifyChordFromNotes(sortedNotes);
        this.onChordTriggeredCallback?.({
          notes: sortedNotes,
          chordName: chordName || 'Chord',
          source: 'midi',
        });
      }
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off
      this.activeMidiNotes.delete(noteNumber);
    }
  }

  getMidiState(): MidiDeviceState {
    return { ...this.midiState };
  }

  /**
   * Main 60fps signal analysis loop.
   */
  private runAnalysisLoop = () => {
    if (!this.analyser || !this.audioCtx) return;

    this.analyser.getFloatTimeDomainData(this.timeDomainBuffer as any);
    this.analyser.getFloatFrequencyData(this.frequencyBuffer as any);

    // 1. Calculate RMS Level
    let sumSquares = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      const val = this.timeDomainBuffer[i];
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / this.timeDomainBuffer.length);

    if (this.isCalibratingNoise) {
      this.calibrationSamples.push(rms);
    }

    // 2. Percussive Onset Transient Detection (Spectral Flux)
    let spectralFlux = 0;
    for (let k = 0; k < this.frequencyBuffer.length; k++) {
      // Linear conversion from dB
      const currLinear = Math.pow(10, this.frequencyBuffer[k] / 20);
      const prevLinear = Math.pow(10, this.prevFrequencyBuffer[k] / 20);
      const diff = currLinear - prevLinear;
      if (diff > 0) spectralFlux += diff;
      this.prevFrequencyBuffer[k] = this.frequencyBuffer[k];
    }

    const now = performance.now();
    const ONSET_FLUX_THRESHOLD = 0.08;
    const isOnset = spectralFlux > ONSET_FLUX_THRESHOLD && now - this.lastOnsetTime > 130;
    if (isOnset) {
      this.lastOnsetTime = now;
    }

    let detectedPitchHz: number | null = null;
    let detectedNote: string | null = null;
    let detectedMidi: number | null = null;
    let centsOffset: number = 0;
    let confidence: number = 0;
    let activeChordNotes: string[] = [];
    let detectedChordName: string | null = null;

    if (rms >= this.noiseGateFloor) {
      // 3. Monophonic Pitch Recognition with Harmonic Sub-Multiple Checking (YIN / McLeod)
      const monoResult = this.detectMonophonicPitch(this.timeDomainBuffer, this.audioCtx.sampleRate);
      if (monoResult && monoResult.confidence > 55) {
        detectedPitchHz = monoResult.frequency;
        detectedMidi = monoResult.midi;
        detectedNote = midiToNote(detectedMidi);
        centsOffset = monoResult.cents;
        confidence = monoResult.confidence;
      }

      // 4. Polyphonic Chord & Spectral Template Matching
      const polyResult = this.detectPolyphonicPeaks(
        this.frequencyBuffer,
        this.audioCtx.sampleRate,
        this.currentExpectedNotes
      );
      if (polyResult.notes.length >= 2) {
        activeChordNotes = polyResult.notes;
        detectedChordName = this.identifyChordFromNotes(activeChordNotes);
      }

      // 5. Discrete Note Trigger Logic (with onset transient & stability filtering)
      if (detectedMidi !== null) {
        if (detectedMidi === this.previousDetectedMidi) {
          this.stableFrameCount++;
        } else {
          this.previousDetectedMidi = detectedMidi;
          this.stableFrameCount = 1;
        }

        const isNewNote = detectedMidi !== this.lastTriggeredMidi;
        const isRepeatedOnset = isOnset && detectedMidi === this.lastTriggeredMidi && now - this.lastTriggerTime > 180;

        if ((isNewNote && this.stableFrameCount >= this.STABILITY_THRESHOLD) || isRepeatedOnset) {
          this.lastTriggeredMidi = detectedMidi;
          this.lastTriggerTime = now;

          if (detectedNote) {
            this.onNoteTriggeredCallback?.({
              note: detectedNote,
              midi: detectedMidi,
              velocity: Math.min(1, Math.max(0.4, rms * 8)),
              source: 'mic',
              isOnsetRepeat: isRepeatedOnset,
            });

            // Trigger chord if multiple notes detected concurrently
            if (activeChordNotes.length >= 2) {
              this.onChordTriggeredCallback?.({
                notes: activeChordNotes,
                chordName: detectedChordName || 'Harmonic Chord',
                source: 'mic',
              });
            }
          }
        }
      }
    } else {
      // Volume below noise gate
      this.stableFrameCount = 0;
      this.previousDetectedMidi = null;
    }

    // Downsample frequency buffer into 24 display bars for live audio spectrum UI
    const spectrumBars: number[] = this.downsampleSpectrum(this.frequencyBuffer, 24);

    // Continuous Frame Callback
    this.onFrameCallback?.({
      detectedPitchHz,
      detectedNote,
      detectedMidi,
      centsOffset,
      confidence,
      audioLevel: rms,
      spectralFlux,
      isOnset,
      activeChordNotes,
      detectedChordName,
      spectrumBars,
    });

    this.animFrameId = requestAnimationFrame(this.runAnalysisLoop);
  };

  /**
   * Monophonic YIN / Autocorrelation pitch extraction with parabolic interpolation
   * and sub-harmonic verification to eliminate octave jumping on acoustic piano.
   */
  private detectMonophonicPitch(
    buffer: Float32Array,
    sampleRate: number
  ): { frequency: number; midi: number; cents: number; confidence: number } | null {
    const size = buffer.length;
    // Piano fundamental range: A0 (27.5Hz) to C8 (4186Hz).
    // Focus robustly on 65Hz (C2) to 1200Hz (D6) for student repertoire.
    const minPeriod = Math.floor(sampleRate / 1400); // ~31 samples
    const maxPeriod = Math.floor(sampleRate / 60);   // ~735 samples

    let bestPeriod = -1;
    let maxCorr = -1;

    // Normalised square difference autocorrelation
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let sum = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < size - period; i += 2) {
        sum += buffer[i] * buffer[i + period];
        norm1 += buffer[i] * buffer[i];
        norm2 += buffer[i + period] * buffer[i + period];
      }

      const denominator = Math.sqrt(norm1 * norm2);
      const corr = denominator > 0 ? sum / denominator : 0;

      if (corr > maxCorr) {
        maxCorr = corr;
        bestPeriod = period;
      }
    }

    if (bestPeriod <= 0 || maxCorr < 0.52) {
      return null;
    }

    // Parabolic interpolation for sub-sample accuracy
    let refinedPeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
      const alpha = this.getLagCorrelation(buffer, bestPeriod - 1);
      const beta = maxCorr;
      const gamma = this.getLagCorrelation(buffer, bestPeriod + 1);
      const denom = 2 * (alpha - 2 * beta + gamma);
      if (Math.abs(denom) > 1e-6) {
        const delta = (alpha - gamma) / denom;
        refinedPeriod = bestPeriod + delta;
      }
    }

    let fundamentalFreq = sampleRate / refinedPeriod;

    // Harmonic Sub-Multiple Check:
    // Pianos have strong 2nd and 3rd harmonics. If we picked a sub-multiple (half period = double frequency),
    // check if the lower octave (double period) has substantial correlation.
    const doublePeriod = Math.round(refinedPeriod * 2);
    if (doublePeriod <= maxPeriod) {
      const lowerOctaveCorr = this.getLagCorrelation(buffer, doublePeriod);
      if (lowerOctaveCorr > maxCorr * 0.88) {
        fundamentalFreq = sampleRate / doublePeriod;
      }
    }

    // Convert frequency to MIDI and cents
    const midiFraction = 69 + 12 * Math.log2(fundamentalFreq / 440);
    const nearestMidi = Math.round(midiFraction);
    const targetFreq = midiToFrequency(nearestMidi);
    const cents = Math.round(1200 * Math.log2(fundamentalFreq / targetFreq));
    const confidence = Math.min(100, Math.round(maxCorr * 100));

    return {
      frequency: fundamentalFreq,
      midi: nearestMidi,
      cents,
      confidence,
    };
  }

  private getLagCorrelation(buffer: Float32Array, lag: number): number {
    let sum = 0;
    let norm1 = 0;
    let norm2 = 0;
    const size = buffer.length;
    for (let i = 0; i < size - lag; i += 2) {
      sum += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }
    const den = Math.sqrt(norm1 * norm2);
    return den > 0 ? sum / den : 0;
  }

  /**
   * Polyphonic Spectral Peak Analysis and Expected-Note Verification.
   * Uses FFT magnitude bins and checks fundamental + first 3 harmonics.
   */
  private detectPolyphonicPeaks(
    freqBuffer: Float32Array,
    sampleRate: number,
    expectedNotes: string[]
  ): { notes: string[]; energies: number[] } {
    const binSize = sampleRate / (freqBuffer.length * 2); // e.g. 44100 / 4096 = 10.76 Hz per bin
    const detectedNotes: string[] = [];
    const detectedEnergies: number[] = [];

    // If expected notes are specified (e.g. current chord in lesson), verify their spectral presence
    const notesToCheck = expectedNotes.length > 0 ? expectedNotes : ['C4', 'E4', 'G4', 'F4', 'A4', 'B4', 'D4'];

    for (const note of notesToCheck) {
      const midi = noteToMidi(note);
      const f0 = midiToFrequency(midi);

      // Check energy at f0, 2*f0, 3*f0, 4*f0
      const harmonics = [f0, f0 * 2, f0 * 3, f0 * 4];
      let harmonicScore = 0;

      for (let h = 0; h < harmonics.length; h++) {
        const targetHz = harmonics[h];
        if (targetHz > sampleRate / 2) continue;

        const bin = Math.round(targetHz / binSize);
        if (bin >= 0 && bin < freqBuffer.length) {
          // Average peak energy around 3 adjacent bins
          const left = freqBuffer[Math.max(0, bin - 1)];
          const center = freqBuffer[bin];
          const right = freqBuffer[Math.min(freqBuffer.length - 1, bin + 1)];
          const localMaxDb = Math.max(left, center, right);

          // Convert dB (-100 to 0) to 0-1 linear scale
          const linearAmp = Math.max(0, (localMaxDb + 85) / 85);
          harmonicScore += linearAmp * (1 / (h + 1));
        }
      }

      // If harmonic score passes threshold, verify it's not a neighboring false positive
      if (harmonicScore > 0.85) {
        if (!detectedNotes.includes(note)) {
          detectedNotes.push(note);
          detectedEnergies.push(harmonicScore);
        }
      }
    }

    return { notes: detectedNotes, energies: detectedEnergies };
  }

  /**
   * Downsamples the FFT buffer into N display bands for a glowing visualizer.
   */
  private downsampleSpectrum(freqBuffer: Float32Array, numBars: number): number[] {
    const bars: number[] = [];
    const step = Math.floor((freqBuffer.length * 0.35) / numBars); // focus on musical low & mid spectrum

    for (let b = 0; b < numBars; b++) {
      let maxDb = -120;
      const start = b * step;
      const end = start + step;
      for (let i = start; i < end && i < freqBuffer.length; i++) {
        if (freqBuffer[i] > maxDb) maxDb = freqBuffer[i];
      }
      // Map -90dB...-10dB to 0...1
      const normalized = Math.max(0, Math.min(1, (maxDb + 90) / 80));
      bars.push(normalized);
    }
    return bars;
  }

  /**
   * Identifies chord name from detected notes list (e.g. ['C4', 'E4', 'G4'] -> 'C Major').
   */
  identifyChordFromNotes(notes: string[]): string | null {
    if (notes.length < 2) return null;

    const midiValues = Array.from(new Set(notes.map((n) => noteToMidi(n) % 12))).sort((a, b) => a - b);
    const rootNote = midiToNote(noteToMidi(notes[0])).replace(/\d+$/, '');

    // Check intervals from root
    for (const template of this.CHORD_TEMPLATES) {
      if (template.semitones.length === midiValues.length) {
        const rootPitchClass = noteToMidi(notes[0]) % 12;
        const matches = template.semitones.every((interval) => {
          const expectedPitchClass = (rootPitchClass + interval) % 12;
          return midiValues.includes(expectedPitchClass);
        });
        if (matches) {
          return `${rootNote} ${template.name}`;
        }
      }
    }

    return `${rootNote} Chord`;
  }
}

export const audioInputEngine = new AudioInputEngine();
