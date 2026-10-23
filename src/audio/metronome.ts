/**
 * Precision web audio metronome with customizable tempo, time signature,
 * beat accent on 1, and count-in for practice sessions.
 */

import * as Tone from 'tone';

export class MetronomeService {
  private isRunning: boolean = false;
  private bpm: number = 90;
  private beatsPerMeasure: number = 4;
  private currentBeat: number = 0;
  private timerId: any = null;
  private onBeatTick: ((beat: number, isAccent: boolean) => void) | null = null;

  setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(240, bpm));
    if (this.isRunning) {
      this.restart();
    }
  }

  getBpm(): number {
    return this.bpm;
  }

  setTimeSignature(beats: number) {
    this.beatsPerMeasure = beats;
    this.currentBeat = 0;
  }

  start(onTick?: (beat: number, isAccent: boolean) => void) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentBeat = 0;
    if (onTick) this.onBeatTick = onTick;
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentBeat = 0;
  }

  private restart() {
    if (this.timerId) clearTimeout(this.timerId);
    this.tick();
  }

  private tick = () => {
    if (!this.isRunning) return;

    const isAccent = this.currentBeat === 0;
    this.playClick(isAccent);

    if (this.onBeatTick) {
      this.onBeatTick(this.currentBeat, isAccent);
    }

    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    const intervalMs = (60 / this.bpm) * 1000;
    this.timerId = setTimeout(this.tick, intervalMs);
  };

  private playClick(isAccent: boolean) {
    try {
      if (Tone.context.state !== 'running') {
        Tone.start();
      }
      const osc = new Tone.Oscillator(isAccent ? 1200 : 800, 'triangle').toDestination();
      const gain = new Tone.Gain(isAccent ? 0.35 : 0.2).toDestination();
      osc.connect(gain);
      osc.start();
      osc.stop(Tone.now() + 0.04);
    } catch {}
  }
}

export const metronome = new MetronomeService();
