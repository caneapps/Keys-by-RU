/**
 * Intelligent Score Alignment & Pedagogical Performance Grader.
 * Provides:
 * - Look-ahead human-friendly timing tolerance windows (±120ms Perfect, ±250ms Good, Early/Late)
 * - Smart Wait Mode with 150ms chord cluster aggregation and partial-chord progress
 * - Specific musical diagnosis (Accidental Errors, Neighbour Slips, Octave Errors, Rhythm Drift)
 * - Structured Session Telemetry recording with bar-by-bar heatmap data and weak bar identification.
 */

import { noteToMidi, midiToNote } from '../utils/musicLogic.ts';

export type TimingVerdict = 'perfect' | 'good' | 'early' | 'late' | 'missed';
export type ErrorDiagnosisType = 'accidental' | 'neighbor' | 'octave' | 'rhythm' | 'wrong_note';

export interface PerformanceEventTelemetry {
  noteIndex: number;
  expectedNotes: string[];
  playedNotes: string[];
  timingOffsetMs: number; // positive = late, negative = early
  timingVerdict: TimingVerdict;
  barNumber: number;
  hesitationMs: number;
  isChord: boolean;
  errorType: ErrorDiagnosisType | null;
  diagnosisMessage: string;
}

export interface BarPerformanceSummary {
  barNumber: number;
  totalNotes: number;
  correctNotes: number;
  accuracyPercent: number;
  mistakesCount: number;
  problematicNotes: string[];
  primaryErrorType: ErrorDiagnosisType | null;
}

export interface SessionTelemetry {
  songOrLessonTitle: string;
  mode: 'wait' | 'tempo';
  bpm: number;
  startTime: number;
  endTime: number;
  totalExpectedNotes: number;
  correctNotesCount: number;
  accuracyPercent: number;
  stars: number;
  events: PerformanceEventTelemetry[];
  barSummaries: BarPerformanceSummary[];
  weakBars: number[]; // Bar numbers with < 75% accuracy
  missedAccidentals: string[];
  averageHesitationMs: number;
  timingBreakdown: {
    perfect: number;
    good: number;
    early: number;
    late: number;
    missed: number;
  };
}

export interface ChordProgressState {
  expectedChordNotes: string[];
  matchedNotes: string[];
  missingNotes: string[];
  isComplete: boolean;
}

export interface MusicalDiagnosis {
  type: ErrorDiagnosisType;
  message: string;
  advice: string;
  expectedNote: string;
  playedNote: string;
}

export class PerformanceGrader {
  // Look-Ahead Tolerance Thresholds (in milliseconds)
  static readonly PERFECT_WINDOW_MS = 120;
  static readonly GOOD_WINDOW_MS = 250;
  // Chord cluster window: notes struck within 150ms count towards the same chord
  static readonly CHORD_CLUSTER_WINDOW_MS = 150;

  private currentTelemetry: SessionTelemetry | null = null;
  private currentChordBuffer: Array<{ note: string; timestamp: number }> = [];
  private stepStartTime: number = 0;

  /**
   * Starts a new graded performance telemetry session.
   */
  startSession(title: string, mode: 'wait' | 'tempo', bpm: number, totalExpectedNotes: number): void {
    this.currentTelemetry = {
      songOrLessonTitle: title,
      mode,
      bpm,
      startTime: Date.now(),
      endTime: 0,
      totalExpectedNotes,
      correctNotesCount: 0,
      accuracyPercent: 100,
      stars: 3,
      events: [],
      barSummaries: [],
      weakBars: [],
      missedAccidentals: [],
      averageHesitationMs: 0,
      timingBreakdown: {
        perfect: 0,
        good: 0,
        early: 0,
        late: 0,
        missed: 0,
      },
    };
    this.currentChordBuffer = [];
    this.stepStartTime = performance.now();
  }

  /**
   * Resets the hesitation timer for the current note or chord.
   */
  notifyStepAdvance(): void {
    this.stepStartTime = performance.now();
    this.currentChordBuffer = [];
  }

  /**
   * Evaluates timing in Tempo Mode using human-friendly tolerance windows.
   */
  static evaluateTiming(offsetMs: number): TimingVerdict {
    const absOffset = Math.abs(offsetMs);
    if (absOffset <= PerformanceGrader.PERFECT_WINDOW_MS) {
      return 'perfect';
    }
    if (absOffset <= PerformanceGrader.GOOD_WINDOW_MS) {
      return 'good';
    }
    return offsetMs < 0 ? 'early' : 'late';
  }

  /**
   * Diagnoses the musical reason behind a wrong note.
   */
  static diagnoseMistake(expectedNote: string, playedNote: string, offsetMs: number = 0): MusicalDiagnosis {
    const expectedMidi = noteToMidi(expectedNote);
    const playedMidi = noteToMidi(playedNote);
    const semitoneDiff = playedMidi - expectedMidi;

    const expectedNameOnly = expectedNote.replace(/\d+$/, '');
    const playedNameOnly = playedNote.replace(/\d+$/, '');

    // 1. Accidental Errors (e.g. played F4 when F#4 expected, or played Bb3 when B3 expected)
    const isAccidentalMismatch =
      (expectedNameOnly.includes('#') || expectedNameOnly.includes('b')) &&
      !playedNameOnly.includes('#') &&
      !playedNameOnly.includes('b') &&
      Math.abs(semitoneDiff) === 1;

    if (isAccidentalMismatch) {
      return {
        type: 'accidental',
        expectedNote,
        playedNote,
        message: `Watch the accidental: you played ${playedNote} (natural) instead of ${expectedNote}.`,
        advice: `Play ${expectedNote} on the black key ${semitoneDiff < 0 ? 'to the right' : 'to the left'}.`,
      };
    }

    // 2. Octave Errors (correct note name, wrong register)
    if (Math.abs(semitoneDiff) % 12 === 0 && semitoneDiff !== 0) {
      const octaves = Math.abs(semitoneDiff) / 12;
      const direction = semitoneDiff > 0 ? 'lower' : 'higher';
      return {
        type: 'octave',
        expectedNote,
        playedNote,
        message: `Right note (${expectedNameOnly}), wrong octave! You played ${playedNote} — target is ${expectedNote}.`,
        advice: `Shift ${octaves} octave${octaves > 1 ? 's' : ''} ${direction} (${octaves * 7} white keys away).`,
      };
    }

    // 3. Neighbour-Key Slips (1 or 2 semitones away)
    if (semitoneDiff === 1) {
      return {
        type: 'neighbor',
        expectedNote,
        playedNote,
        message: `Neighbour slip: you played ${playedNote} — 1 half-step too high.`,
        advice: `Drop one half-step lower to reach ${expectedNote}.`,
      };
    }
    if (semitoneDiff === -1) {
      return {
        type: 'neighbor',
        expectedNote,
        playedNote,
        message: `Neighbour slip: you played ${playedNote} — 1 half-step too low.`,
        advice: `Step one half-step higher to reach ${expectedNote}.`,
      };
    }
    if (semitoneDiff === 2) {
      return {
        type: 'neighbor',
        expectedNote,
        playedNote,
        message: `1 white key too high: drop down from ${playedNote} to ${expectedNote}.`,
        advice: `Move your finger one white key to the left.`,
      };
    }
    if (semitoneDiff === -2) {
      return {
        type: 'neighbor',
        expectedNote,
        playedNote,
        message: `1 white key too low: step up from ${playedNote} to ${expectedNote}.`,
        advice: `Move your finger one white key to the right.`,
      };
    }

    // 4. Rhythm Drift (played correct pitch, but rushed or dragged)
    if (semitoneDiff === 0 && Math.abs(offsetMs) > PerformanceGrader.GOOD_WINDOW_MS) {
      return {
        type: 'rhythm',
        expectedNote,
        playedNote,
        message: offsetMs < 0 ? 'Rushing ahead of the beat.' : 'Dragging behind the pulse.',
        advice: offsetMs < 0
          ? 'Hold back slightly and listen for the metronome click.'
          : 'Anticipate the downbeat with a lighter wrist rebound.',
      };
    }

    // General note difference
    const direction = semitoneDiff > 0 ? 'lower' : 'higher';
    return {
      type: 'wrong_note',
      expectedNote,
      playedNote,
      message: `You played ${playedNote} — target is ${expectedNote}.`,
      advice: `Aim ${Math.abs(semitoneDiff)} semitones ${direction} to find ${expectedNote}.`,
    };
  }

  /**
   * Tracks partial chord progress during Smart Wait Mode.
   * Clusters notes played within 150ms.
   */
  evaluateChordProgress(
    expectedChordNotes: string[],
    newPlayedNote: string,
    timestamp: number = performance.now()
  ): ChordProgressState {
    // Purge notes outside cluster window
    this.currentChordBuffer = this.currentChordBuffer.filter(
      (item) => timestamp - item.timestamp <= PerformanceGrader.CHORD_CLUSTER_WINDOW_MS
    );
    this.currentChordBuffer.push({ note: newPlayedNote, timestamp });

    const playedUnique = Array.from(new Set(this.currentChordBuffer.map((b) => b.note)));
    const matchedNotes = expectedChordNotes.filter((n) => playedUnique.includes(n));
    const missingNotes = expectedChordNotes.filter((n) => !playedUnique.includes(n));
    const isComplete = missingNotes.length === 0;

    return {
      expectedChordNotes,
      matchedNotes,
      missingNotes,
      isComplete,
    };
  }

  /**
   * Records a single note or chord evaluation event into the active session telemetry.
   */
  recordEvent(params: {
    noteIndex: number;
    expectedNotes: string[];
    playedNotes: string[];
    timingOffsetMs?: number;
    barNumber: number;
    isChord?: boolean;
  }): PerformanceEventTelemetry {
    const now = performance.now();
    const hesitationMs = Math.max(0, Math.round(now - this.stepStartTime));
    const offsetMs = params.timingOffsetMs ?? 0;
    const isChord = params.isChord ?? params.expectedNotes.length > 1;

    // Check correctness
    let isCorrect = false;
    if (isChord) {
      isCorrect = params.expectedNotes.every((n) => params.playedNotes.includes(n));
    } else {
      isCorrect = params.expectedNotes[0] === params.playedNotes[0];
    }

    let verdict: TimingVerdict = 'perfect';
    let errorType: ErrorDiagnosisType | null = null;
    let diagnosisMessage = 'Spot on!';

    if (isCorrect) {
      verdict = offsetMs !== 0 ? PerformanceGrader.evaluateTiming(offsetMs) : 'perfect';
      if (verdict === 'early' || verdict === 'late') {
        const diag = PerformanceGrader.diagnoseMistake(params.expectedNotes[0], params.playedNotes[0], offsetMs);
        errorType = diag.type;
        diagnosisMessage = diag.message;
      }
    } else {
      verdict = 'missed';
      const expected = params.expectedNotes[0] || 'C4';
      const played = params.playedNotes[0] || 'Unknown';
      const diag = PerformanceGrader.diagnoseMistake(expected, played, offsetMs);
      errorType = diag.type;
      diagnosisMessage = diag.message;

      if (diag.type === 'accidental' && this.currentTelemetry) {
        if (!this.currentTelemetry.missedAccidentals.includes(expected)) {
          this.currentTelemetry.missedAccidentals.push(expected);
        }
      }
    }

    const event: PerformanceEventTelemetry = {
      noteIndex: params.noteIndex,
      expectedNotes: params.expectedNotes,
      playedNotes: params.playedNotes,
      timingOffsetMs: offsetMs,
      timingVerdict: verdict,
      barNumber: params.barNumber,
      hesitationMs,
      isChord,
      errorType,
      diagnosisMessage,
    };

    if (this.currentTelemetry) {
      this.currentTelemetry.events.push(event);
      if (isCorrect) {
        this.currentTelemetry.correctNotesCount++;
      }
      this.currentTelemetry.timingBreakdown[verdict]++;
    }

    return event;
  }

  /**
   * Finalises session telemetry, computes bar-by-bar heatmap breakdown and isolates weak bars.
   */
  finishSession(): SessionTelemetry {
    if (!this.currentTelemetry) {
      this.startSession('Practice Session', 'wait', 100, 10);
    }
    const t = this.currentTelemetry!;
    t.endTime = Date.now();

    const totalEvents = Math.max(1, t.events.length);
    t.accuracyPercent = Math.round((t.correctNotesCount / totalEvents) * 100);

    // Compute star rating
    if (t.accuracyPercent >= 90) t.stars = 3;
    else if (t.accuracyPercent >= 75) t.stars = 2;
    else if (t.accuracyPercent >= 55) t.stars = 1;
    else t.stars = 0;

    // Average hesitation
    const totalHesitation = t.events.reduce((sum, e) => sum + e.hesitationMs, 0);
    t.averageHesitationMs = Math.round(totalHesitation / totalEvents);

    // Compute bar-by-bar heatmap summaries
    const barMap = new Map<number, PerformanceEventTelemetry[]>();
    for (const evt of t.events) {
      const list = barMap.get(evt.barNumber) || [];
      list.push(evt);
      barMap.set(evt.barNumber, list);
    }

    t.barSummaries = [];
    t.weakBars = [];

    const sortedBars = Array.from(barMap.keys()).sort((a, b) => a - b);
    for (const barNum of sortedBars) {
      const barEvents = barMap.get(barNum) || [];
      const totalInBar = barEvents.length;
      const correctInBar = barEvents.filter((e) => e.timingVerdict === 'perfect' || e.timingVerdict === 'good').length;
      const mistakesCount = totalInBar - correctInBar;
      const accuracyPercent = Math.round((correctInBar / Math.max(1, totalInBar)) * 100);

      const problematicNotes: string[] = [];
      const errorCounts = new Map<ErrorDiagnosisType, number>();

      for (const e of barEvents) {
        if (e.errorType) {
          errorCounts.set(e.errorType, (errorCounts.get(e.errorType) || 0) + 1);
          problematicNotes.push(...e.expectedNotes);
        }
      }

      let primaryErrorType: ErrorDiagnosisType | null = null;
      let maxCount = 0;
      for (const [errType, count] of errorCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          primaryErrorType = errType;
        }
      }

      t.barSummaries.push({
        barNumber: barNum,
        totalNotes: totalInBar,
        correctNotes: correctInBar,
        accuracyPercent,
        mistakesCount,
        problematicNotes: Array.from(new Set(problematicNotes)),
        primaryErrorType,
      });

      // Flag weak bars with accuracy < 80% or >= 2 mistakes
      if (accuracyPercent < 80 || mistakesCount >= 2) {
        t.weakBars.push(barNum);
      }
    }

    return { ...t };
  }

  getCurrentTelemetry(): SessionTelemetry | null {
    return this.currentTelemetry ? { ...this.currentTelemetry } : null;
  }
}

export const performanceGrader = new PerformanceGrader();
