/**
 * Types for Keys by Ru
 * British English conventions used throughout (e.g. colour, programme, synchronised).
 */

export type ClefType = 'treble' | 'bass';
export type HandType = 'left' | 'right' | 'both';

export interface PracticeNote {
  id?: string;
  note: string; // e.g. "C4", "G4", "F#4"
  duration: number; // in quarter beats (e.g. 1 = quarter note, 2 = half note, 4 = whole note)
  finger?: 1 | 2 | 3 | 4 | 5;
  hand?: 'left' | 'right';
  clef?: ClefType;
  beatOffset: number; // offset in quarter notes from piece start
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  levelId: string;
  unitId: string;
  title: string;
  subtitle: string;
  durationMin: number;
  xpReward: number;
  isLocked: boolean;
  isCompleted: boolean;
  stars: number; // 0 to 3
  theoryText: string;
  keyboardDemoNotes: string[];
  practiceNotes: PracticeNote[];
  quiz: QuizQuestion[];
}

export interface Unit {
  id: string;
  levelId: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Level {
  id: string;
  number: number;
  title: string;
  description: string;
  units: Unit[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface AppSettings {
  inputMethod: 'keyboard' | 'mic' | 'midi';
  showNoteNames: boolean;
  colourCodedNotes: boolean;
  showFingerNumbers: boolean;
  keySize: 'compact' | 'normal' | 'large';
  hapticsEnabled: boolean;
  leftHanded: boolean;
  theme: 'dark' | 'light';
  neonThemeId?: 'signature-pink' | 'neon-green' | 'cyber-yellow' | 'electric-blue' | 'deep-purple' | 'chrome-silver' | 'crimson-red';
  metronomeSound: 'click' | 'woodblock' | 'beep';
}

export interface AvatarConfig {
  icon: string; // e.g. '🎹', '🎧', '🎼', '🎸', '🥁', '🎙️', '✨', '⚡'
  bgColour: string; // hex colour or gradient token
}

export interface PracticeSessionLog {
  id: string;
  date: string;
  title: string;
  durationSeconds: number;
  xpEarned: number;
  score: number;
}

export interface SavedProject {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  createdAt: string;
  updatedAt: string;
  gridData: DrumStepGrid | Record<string, boolean[]>;
  bassSteps: Record<number, string>;
}

export interface UserProfile {
  id: string; // Unique UUID
  name: string;
  avatar: AvatarConfig;
  createdAt: string;
  lastActiveAt: string;
  skillLevel: 'never_played' | 'know_some_notes' | 'play_simple_songs';
  goal: 'learn_songs' | 'make_music' | 'both';
  dailyGoalMinutes: number; // 5, 10, 15, 20
  dailyXpTarget: number; // e.g. 50, 100, 150, 200 XP
  dailyXpEarnedToday: number;
  dominantHand: 'right' | 'left';
  reminderTime?: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeAvailable: boolean;
  lastPracticeDate?: string;
  completedLessons: Record<string, { stars: number; score: number; completedAt: string }>;
  unlockedBadges: string[];
  practiceHistory: PracticeSessionLog[];
  savedProjects: SavedProject[];
  settings: AppSettings;
}

export interface ProfileBackupData {
  version: number;
  exportedAt: string;
  app: 'Keys by Ru';
  profile: UserProfile;
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  level: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bpm: number;
  timeSignature: string;
  keySignature: string;
  notes: PracticeNote[];
  description: string;
}

export type TrackGenre = 'hip-hop' | 'trap' | 'house' | 'pop' | 'lo-fi' | 'r&b' | 'afrobeats';

export interface DrumStepGrid {
  kick: boolean[];
  snare: boolean[];
  clap: boolean[];
  hihatClosed: boolean[];
  hihatOpen: boolean[];
  perc: boolean[];
}

export interface BassPatternItem {
  step: number;
  note: string;
  length: number;
}

export interface ChordPadItem {
  name: string;
  notes: string[];
  category: 'Major' | 'Minor' | '7th';
}
