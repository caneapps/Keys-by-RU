import test from 'node:test';
import assert from 'node:assert/strict';
import {
  noteToMidi,
  midiToNote,
  midiToFrequency,
  calculateStars,
  calculateXpReward,
  getScaleNotes,
  getChordNotes,
  formatDuration,
  calculateLevel,
  calculateDailyProgress,
  evaluateStreakOnPractice,
  getPitchCorrectionGuidance,
} from './musicLogic.ts';

test('noteToMidi converts standard notes correctly', () => {
  assert.equal(noteToMidi('C4'), 60);
  assert.equal(noteToMidi('A4'), 69);
  assert.equal(noteToMidi('C3'), 48);
  assert.equal(noteToMidi('C5'), 72);
});

test('noteToMidi normalises flats correctly', () => {
  assert.equal(noteToMidi('Bb4'), 70); // A#4 is 70
  assert.equal(noteToMidi('Eb4'), 63); // D#4 is 63
  assert.equal(noteToMidi('Db4'), 61); // C#4 is 61
});

test('midiToNote converts MIDI numbers back to note names', () => {
  assert.equal(midiToNote(60), 'C4');
  assert.equal(midiToNote(69), 'A4');
  assert.equal(midiToNote(48), 'C3');
});

test('midiToFrequency matches concert pitch A440', () => {
  const freqA4 = midiToFrequency(69);
  assert.ok(Math.abs(freqA4 - 440) < 0.001);
});

test('calculateStars awards correct star tiers based on accuracy', () => {
  assert.equal(calculateStars(95), 3);
  assert.equal(calculateStars(90), 3);
  assert.equal(calculateStars(85), 2);
  assert.equal(calculateStars(75), 2);
  assert.equal(calculateStars(60), 1);
  assert.equal(calculateStars(40), 0);
});

test('calculateXpReward calculates bonus for accuracy and streak', () => {
  const lowReward = calculateXpReward(50, 40, 0);
  assert.equal(lowReward, 50);

  const highReward = calculateXpReward(50, 95, 3);
  // 50 * 1.5 + 15 = 90
  assert.equal(highReward, 90);
});

test('getScaleNotes generates C major scale correctly', () => {
  const cMajor = getScaleNotes('C', 'major');
  assert.deepEqual(cMajor, ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
});

test('getChordNotes generates C major triad correctly', () => {
  const cMajorChord = getChordNotes('C', 'major');
  assert.deepEqual(cMajorChord, ['C4', 'E4', 'G4']);
});

test('formatDuration formats mm:ss display cleanly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(600), '10:00');
});

test('calculateLevel computes ascending musician levels', () => {
  assert.equal(calculateLevel(0), 1);
  assert.equal(calculateLevel(90), 1);
  assert.equal(calculateLevel(120), 2);
  assert.equal(calculateLevel(300), 3);
  assert.equal(calculateLevel(600), 4);
  assert.equal(calculateLevel(1000), 5);
});

test('calculateDailyProgress correctly returns percentage and remaining XP', () => {
  const result = calculateDailyProgress(45, 60);
  assert.equal(result.percent, 75);
  assert.equal(result.isGoalReached, false);
  assert.equal(result.remainingXp, 15);

  const completed = calculateDailyProgress(80, 60);
  assert.equal(completed.percent, 133);
  assert.equal(completed.clampedPercent, 100);
  assert.equal(completed.isGoalReached, true);
  assert.equal(completed.remainingXp, 0);
});

test('evaluateStreakOnPractice updates streak appropriately', () => {
  // First time ever
  assert.deepEqual(evaluateStreakOnPractice(undefined, 0, '2026-10-22'), {
    newStreak: 1,
    isFirstPracticeToday: true,
  });

  // Consecutive day
  assert.deepEqual(evaluateStreakOnPractice('2026-10-21', 3, '2026-10-22'), {
    newStreak: 4,
    isFirstPracticeToday: true,
  });

  // Same day
  assert.deepEqual(evaluateStreakOnPractice('2026-10-22', 4, '2026-10-22'), {
    newStreak: 4,
    isFirstPracticeToday: false,
  });

  // Gap of 2 days
  assert.deepEqual(evaluateStreakOnPractice('2026-10-19', 5, '2026-10-22'), {
    newStreak: 1,
    isFirstPracticeToday: true,
  });
});

test('getPitchCorrectionGuidance provides exact feedback for identical notes', () => {
  const result = getPitchCorrectionGuidance('C4', 'C4');
  assert.equal(result.isCorrect, true);
  assert.equal(result.semitoneDiff, 0);
  assert.match(result.message, /Spot on/);
});

test('getPitchCorrectionGuidance detects adjacent keys and directions', () => {
  // D4 played when C4 expected (+2 semitones)
  const leftStep = getPitchCorrectionGuidance('C4', 'D4');
  assert.equal(leftStep.isCorrect, false);
  assert.equal(leftStep.semitoneDiff, 2);
  assert.match(leftStep.message, /one white key to the left/);

  // C4 played when D4 expected (-2 semitones)
  const rightStep = getPitchCorrectionGuidance('D4', 'C4');
  assert.equal(rightStep.isCorrect, false);
  assert.equal(rightStep.semitoneDiff, -2);
  assert.match(rightStep.message, /one white key to the right/);
});

test('getPitchCorrectionGuidance highlights accidental/sharp missteps', () => {
  const sharpCheck = getPitchCorrectionGuidance('F#4', 'F4');
  assert.equal(sharpCheck.isCorrect, false);
  assert.match(sharpCheck.message, /Watch the sharp/);
  assert.match(sharpCheck.advice, /black key/);
});

test('getPitchCorrectionGuidance detects octave mismatch', () => {
  const octaveCheck = getPitchCorrectionGuidance('C4', 'C5');
  assert.equal(octaveCheck.isCorrect, false);
  assert.equal(octaveCheck.semitoneDiff, 12);
  assert.match(octaveCheck.message, /wrong octave/);
});

