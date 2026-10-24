import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PerformanceGrader,
  performanceGrader,
} from './performanceGrader.ts';

test('PerformanceGrader evaluates timing within look-ahead human tolerance windows', () => {
  // ±120ms is Perfect
  assert.equal(PerformanceGrader.evaluateTiming(0), 'perfect');
  assert.equal(PerformanceGrader.evaluateTiming(80), 'perfect');
  assert.equal(PerformanceGrader.evaluateTiming(-110), 'perfect');

  // ±250ms is Good
  assert.equal(PerformanceGrader.evaluateTiming(150), 'good');
  assert.equal(PerformanceGrader.evaluateTiming(-220), 'good');

  // Beyond ±250ms is Early or Late
  assert.equal(PerformanceGrader.evaluateTiming(320), 'late');
  assert.equal(PerformanceGrader.evaluateTiming(-280), 'early');
});

test('PerformanceGrader diagnoses accidental errors with sharp/flat guidance', () => {
  const diag = PerformanceGrader.diagnoseMistake('F#4', 'F4');
  assert.equal(diag.type, 'accidental');
  assert.match(diag.message, /Watch the accidental/);
  assert.match(diag.advice, /black key/);
});

test('PerformanceGrader diagnoses neighbour-key slips', () => {
  // D4 played when C4 expected (+2 semitones, 1 white key higher)
  const slip1 = PerformanceGrader.diagnoseMistake('C4', 'D4');
  assert.equal(slip1.type, 'neighbor');
  assert.match(slip1.message, /1 white key too high/);

  // C#4 played when C4 expected (+1 semitone, 1 half-step higher)
  const slip2 = PerformanceGrader.diagnoseMistake('C4', 'C#4');
  assert.equal(slip2.type, 'neighbor');
  assert.match(slip2.message, /1 half-step too high/);
});

test('PerformanceGrader diagnoses octave errors', () => {
  const octaveDiag = PerformanceGrader.diagnoseMistake('C4', 'C5');
  assert.equal(octaveDiag.type, 'octave');
  assert.match(octaveDiag.message, /wrong octave/);
});

test('PerformanceGrader tracks Smart Wait Mode partial chord progress and clusters', () => {
  const grader = new PerformanceGrader();
  const chord = ['C4', 'E4', 'G4'];

  const now = 1000;
  // User hits C4
  const step1 = grader.evaluateChordProgress(chord, 'C4', now);
  assert.equal(step1.isComplete, false);
  assert.deepEqual(step1.matchedNotes, ['C4']);
  assert.deepEqual(step1.missingNotes, ['E4', 'G4']);

  // User hits E4 within 50ms
  const step2 = grader.evaluateChordProgress(chord, 'E4', now + 50);
  assert.equal(step2.isComplete, false);
  assert.deepEqual(step2.matchedNotes, ['C4', 'E4']);
  assert.deepEqual(step2.missingNotes, ['G4']);

  // User hits G4 within 110ms from start (within 150ms cluster window)
  const step3 = grader.evaluateChordProgress(chord, 'G4', now + 110);
  assert.equal(step3.isComplete, true);
  assert.deepEqual(step3.missingNotes, []);
});

test('PerformanceGrader records session telemetry and identifies weak bars', () => {
  const grader = new PerformanceGrader();
  grader.startSession('Ode to Joy', 'wait', 108, 6);

  // Bar 1: all correct
  grader.recordEvent({ noteIndex: 0, expectedNotes: ['E4'], playedNotes: ['E4'], barNumber: 1 });
  grader.recordEvent({ noteIndex: 1, expectedNotes: ['E4'], playedNotes: ['E4'], barNumber: 1 });

  // Bar 2: mistakes
  grader.recordEvent({ noteIndex: 2, expectedNotes: ['F4'], playedNotes: ['G4'], barNumber: 2 });
  grader.recordEvent({ noteIndex: 3, expectedNotes: ['G4'], playedNotes: ['A4'], barNumber: 2 });

  const summary = grader.finishSession();
  assert.equal(summary.barSummaries.length, 2);
  assert.equal(summary.barSummaries[0].accuracyPercent, 100);
  assert.equal(summary.barSummaries[1].accuracyPercent, 0);
  assert.deepEqual(summary.weakBars, [2]);
});
