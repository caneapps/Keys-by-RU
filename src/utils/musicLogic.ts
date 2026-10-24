/**
 * Pure music theory and game logic functions for Keys by Ru.
 * British English spelling conventions used.
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const NOTE_COLOURS: Record<string, string> = {
  C: '#ef4444', // Red
  'C#': '#f97316',
  D: '#f59e0b', // Amber / Orange
  'D#': '#eab308',
  E: '#84cc16', // Yellow-Green
  F: '#10b981', // Emerald / Green
  'F#': '#06b6d4',
  G: '#0ea5e9', // Sky Blue
  'G#': '#3b82f6',
  A: '#6366f1', // Indigo / Blue
  'A#': '#8b5cf6',
  B: '#d946ef', // Fuchsia / Purple
};

/**
 * Parses a note string like "C4", "F#3", "Bb4" to MIDI pitch number.
 */
export function noteToMidi(note: string): number {
  if (!note) return 60;
  
  // Normalise flats to sharps
  let clean = note.trim();
  clean = clean.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');

  const match = clean.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;

  const letter = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(letter as any);
  if (noteIndex === -1) return 60;

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Converts MIDI number to standard note string (e.g. 60 -> "C4").
 */
export function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Calculates frequency in Hertz for a given MIDI note.
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Returns colour hex code for a given note name.
 */
export function getNoteColour(note: string): string {
  const noteLetter = note.replace(/\d+$/, '');
  return NOTE_COLOURS[noteLetter] || '#38bdf8';
}

/**
 * Calculates stars earned based on percentage accuracy.
 */
export function calculateStars(accuracyPercentage: number): number {
  if (accuracyPercentage >= 90) return 3;
  if (accuracyPercentage >= 75) return 2;
  if (accuracyPercentage >= 50) return 1;
  return 0;
}

/**
 * Calculates total XP awarded for completing a session or mission.
 */
export function calculateXpReward(baseXp: number, accuracy: number, streak: number): number {
  const accuracyMultiplier = accuracy >= 90 ? 1.5 : accuracy >= 70 ? 1.2 : 1.0;
  const streakBonus = Math.min(streak * 5, 50);
  return Math.round(baseXp * accuracyMultiplier + streakBonus);
}

/**
 * Generates notes for a given scale.
 */
export function getScaleNotes(root: string, type: 'major' | 'minor' | 'pentatonic'): string[] {
  const baseMidi = noteToMidi(`${root}4`);
  const intervals =
    type === 'major'
      ? [0, 2, 4, 5, 7, 9, 11, 12]
      : type === 'minor'
      ? [0, 2, 3, 5, 7, 8, 10, 12]
      : [0, 2, 4, 7, 9, 12]; // pentatonic

  return intervals.map((semitones) => midiToNote(baseMidi + semitones));
}

/**
 * Generates notes for a chord in root position or inversion.
 */
export function getChordNotes(root: string, chordType: 'major' | 'minor' | '7th', inversion: number = 0): string[] {
  const rootMidi = noteToMidi(`${root}4`);
  let intervals: number[];

  if (chordType === 'major') {
    intervals = [0, 4, 7];
  } else if (chordType === 'minor') {
    intervals = [0, 3, 7];
  } else {
    intervals = [0, 4, 7, 10];
  }

  let chordMidis = intervals.map((i) => rootMidi + i);
  if (inversion === 1) {
    chordMidis[0] += 12;
    chordMidis.sort((a, b) => a - b);
  } else if (inversion === 2) {
    chordMidis[0] += 12;
    chordMidis[1] += 12;
    chordMidis.sort((a, b) => a - b);
  }

  return chordMidis.map((m) => midiToNote(m));
}

/**
 * Formats seconds into mm:ss display for timers.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates user musician level based on total earned XP.
 * Level 1: 0-99 XP, Level 2: 100-249 XP, Level 3: 250-499 XP, Level 4: 500-899 XP, Level 5: 900+ XP.
 */
export function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 900) return 4;
  if (xp < 1500) return 5;
  if (xp < 2500) return 6;
  return Math.floor((xp - 2500) / 1000) + 7;
}

/**
 * Calculates percentage progress towards daily XP goal.
 */
export function calculateDailyProgress(earnedToday: number, target: number): {
  percent: number;
  clampedPercent: number;
  isGoalReached: boolean;
  remainingXp: number;
} {
  const safeTarget = Math.max(1, target || 50);
  const percent = Math.round((earnedToday / safeTarget) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const remainingXp = Math.max(0, safeTarget - earnedToday);
  return {
    percent,
    clampedPercent,
    isGoalReached: earnedToday >= safeTarget,
    remainingXp,
  };
}

/**
 * Evaluates streak based on ISO date strings (YYYY-MM-DD).
 */
export function evaluateStreakOnPractice(
  lastPracticeDateStr: string | undefined,
  currentStreak: number,
  todayDateStr: string = new Date().toISOString().split('T')[0]
): { newStreak: number; isFirstPracticeToday: boolean } {
  if (!lastPracticeDateStr) {
    return { newStreak: Math.max(1, currentStreak), isFirstPracticeToday: true };
  }

  if (lastPracticeDateStr === todayDateStr) {
    // Already practiced today, keep current streak
    return { newStreak: currentStreak, isFirstPracticeToday: false };
  }

  const lastDate = new Date(lastPracticeDateStr);
  const today = new Date(todayDateStr);
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 1) {
    // Exactly consecutive day
    return { newStreak: currentStreak + 1, isFirstPracticeToday: true };
  } else if (diffDays > 1) {
    // Missed at least one day, resets to 1
    return { newStreak: 1, isFirstPracticeToday: true };
  }

  return { newStreak: currentStreak, isFirstPracticeToday: false };
}

export interface PitchCorrectionGuidance {
  message: string;
  isCorrect: boolean;
  semitoneDiff: number;
  expectedNote: string;
  playedNote: string;
  advice: string;
}

/**
 * Provides real-time pedagogical pitch guidance when a musician plays a note on piano.
 * Uses British English terminology and spatial keyboard orientation (left/right, semitones, octaves).
 */
export function getPitchCorrectionGuidance(expectedNote: string, playedNote: string): PitchCorrectionGuidance {
  const expectedMidi = noteToMidi(expectedNote);
  const playedMidi = noteToMidi(playedNote);
  const diff = playedMidi - expectedMidi;

  if (diff === 0) {
    return {
      message: `Spot on! You played ${expectedNote}.`,
      isCorrect: true,
      semitoneDiff: 0,
      expectedNote,
      playedNote,
      advice: 'Crisp pitch hit!',
    };
  }

  // Same pitch class, different octave
  if (Math.abs(diff) % 12 === 0) {
    const octaves = Math.abs(diff) / 12;
    const direction = diff > 0 ? 'lower' : 'higher';
    return {
      message: `Right note, wrong octave! You played ${playedNote} — target is ${expectedNote}.`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Try ${expectedNote} (${octaves} octave${octaves > 1 ? 's' : ''} ${direction}, ${octaves * 7} white keys away).`,
    };
  }

  // Accidental confusion (e.g. F vs F#)
  const expectedBase = expectedNote.replace(/\d+$/, '');
  const playedBase = playedNote.replace(/\d+$/, '');
  if (expectedBase.includes('#') && !playedBase.includes('#') && Math.abs(diff) === 1) {
    return {
      message: `Watch the sharp: play ${expectedNote} instead of ${playedNote}.`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Play ${expectedNote} on the black key immediately ${diff < 0 ? 'to the right' : 'to the left'}.`,
    };
  }

  // 1 or 2 semitones away (adjacent keys)
  if (diff === 1) {
    return {
      message: `You played ${playedNote} — try ${expectedNote} (one half-step lower).`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Move one key to the left for ${expectedNote}.`,
    };
  }
  if (diff === -1) {
    return {
      message: `You played ${playedNote} — try ${expectedNote} (one half-step higher).`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Move one key to the right for ${expectedNote}.`,
    };
  }
  if (diff === 2) {
    return {
      message: `You played ${playedNote} — try ${expectedNote} (one white key to the left).`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Step left to reach ${expectedNote}.`,
    };
  }
  if (diff === -2) {
    return {
      message: `You played ${playedNote} — try ${expectedNote} (one white key to the right).`,
      isCorrect: false,
      semitoneDiff: diff,
      expectedNote,
      playedNote,
      advice: `Step right to reach ${expectedNote}.`,
    };
  }

  const direction = diff > 0 ? 'lower' : 'higher';
  const distance = Math.abs(diff);
  return {
    message: `You played ${playedNote} — target is ${expectedNote}.`,
    isCorrect: false,
    semitoneDiff: diff,
    expectedNote,
    playedNote,
    advice: `Aim ${distance} semitones ${direction} to find ${expectedNote}.`,
  };
}

