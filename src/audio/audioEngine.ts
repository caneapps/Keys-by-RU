/**
 * Web Audio and Tone.js sound synthesis engine for Keys by Ru.
 * Handles iOS audio context unlocking on gesture, low-latency polyphonic acoustic piano,
 * bass synthesizers, and drum instruments.
 */

import * as Tone from 'tone';

class AudioEngine {
  private isInitialised: boolean = false;
  private pianoSynth: Tone.PolySynth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private drumKick: Tone.MembraneSynth | null = null;
  private drumSnare: Tone.NoiseSynth | null = null;
  private drumClap: Tone.NoiseSynth | null = null;
  private drumHihatClosed: Tone.MetalSynth | null = null;
  private drumHihatOpen: Tone.MetalSynth | null = null;
  private drumPerc: Tone.MembraneSynth | null = null;
  private masterLimiter: Tone.Limiter | null = null;

  async ensureAudioContext(): Promise<boolean> {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      if (!this.isInitialised) {
        this.initInstruments();
        this.isInitialised = true;
      }
      return true;
    } catch (e) {
      console.warn('Audio context unlock deferred until user interaction:', e);
      return false;
    }
  }

  private initInstruments() {
    this.masterLimiter = new Tone.Limiter(-1).toDestination();

    // High quality acoustic piano simulation using Tone.PolySynth
    // Dual oscillator with rich harmonic envelope and low touch-to-sound latency
    this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8', // gives warm acoustic body
      },
      envelope: {
        attack: 0.004, // instantaneous response on iPhone touch
        decay: 1.8,
        sustain: 0.2,
        release: 1.4,
      },
      volume: -4,
    });

    const pianoFilter = new Tone.Filter({
      frequency: 4500,
      type: 'lowpass',
      rolloff: -12,
    });

    const pianoReverb = new Tone.Reverb({
      decay: 1.6,
      preDelay: 0.01,
      wet: 0.25,
    });

    this.pianoSynth.chain(pianoFilter, pianoReverb, this.masterLimiter);

    // Bass Synth (Sub / 808 style)
    this.bassSynth = new Tone.MonoSynth({
      oscillator: {
        type: 'triangle',
      },
      filter: {
        Q: 4,
        type: 'lowpass',
        rolloff: -24,
      },
      envelope: {
        attack: 0.01,
        decay: 0.8,
        sustain: 0.4,
        release: 0.8,
      },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 0.2,
        release: 0.6,
        baseFrequency: 55,
        octaves: 2.5,
      },
      volume: -2,
    }).connect(this.masterLimiter);

    // Drum Synths
    this.drumKick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
      volume: 0,
    }).connect(this.masterLimiter);

    this.drumSnare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      volume: -6,
    }).connect(this.masterLimiter);

    this.drumClap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0 },
      volume: -7,
    }).connect(this.masterLimiter);

    this.drumHihatClosed = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -16,
    }).connect(this.masterLimiter);

    this.drumHihatOpen = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.35, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -16,
    }).connect(this.masterLimiter);

    this.drumPerc = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -8,
    }).connect(this.masterLimiter);
  }

  triggerPianoAttack(note: string, velocity: number = 0.8) {
    this.ensureAudioContext();
    try {
      if (this.pianoSynth) {
        this.pianoSynth.triggerAttack(note, Tone.now(), velocity);
      }
    } catch {}
  }

  triggerPianoRelease(note: string) {
    try {
      if (this.pianoSynth) {
        this.pianoSynth.triggerRelease(note, Tone.now() + 0.05);
      }
    } catch {}
  }

  playPianoNote(note: string, duration: string = '8n', velocity: number = 0.8) {
    this.ensureAudioContext();
    try {
      if (this.pianoSynth) {
        this.pianoSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
      }
    } catch {}
  }

  playBassNote(note: string, duration: string = '8n') {
    this.ensureAudioContext();
    try {
      if (this.bassSynth) {
        this.bassSynth.triggerAttackRelease(note, duration, Tone.now());
      }
    } catch {}
  }

  playDrum(type: 'kick' | 'snare' | 'clap' | 'hihatClosed' | 'hihatOpen' | 'perc') {
    this.ensureAudioContext();
    const now = Tone.now();
    try {
      switch (type) {
        case 'kick':
          this.drumKick?.triggerAttackRelease('C1', '8n', now);
          break;
        case 'snare':
          this.drumSnare?.triggerAttackRelease('16n', now);
          break;
        case 'clap':
          this.drumClap?.triggerAttackRelease('16n', now);
          break;
        case 'hihatClosed':
          this.drumHihatClosed?.triggerAttackRelease('32n', now);
          break;
        case 'hihatOpen':
          this.drumHihatOpen?.triggerAttackRelease('8n', now);
          break;
        case 'perc':
          this.drumPerc?.triggerAttackRelease('G2', '16n', now);
          break;
      }
    } catch {}
  }
}

export const audioEngine = new AudioEngine();
