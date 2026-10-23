/**
 * Local storage service for Keys by Ru using IndexedDB with LocalStorage fallback.
 * Manages complete profile-based progress saving, multi-user profiles, and backup/restore.
 */

import { UserProfile, AppSettings, AvatarConfig, ProfileBackupData, SavedProject } from '../types/index.ts';
import { calculateLevel } from '../utils/musicLogic.ts';

const DB_NAME = 'keys_by_ru_db';
const DB_VERSION = 2; // Bumped version for multi-profile schema
const STORE_PROFILES = 'profiles';
const STORE_META = 'metadata';

export const DEFAULT_SETTINGS: AppSettings = {
  inputMethod: 'keyboard',
  showNoteNames: true,
  colourCodedNotes: true,
  showFingerNumbers: true,
  keySize: 'normal',
  hapticsEnabled: true,
  leftHanded: false,
  theme: 'dark',
  metronomeSound: 'click',
};

export const AVATAR_PRESETS: AvatarConfig[] = [
  { icon: 'piano', bgColour: '#161d31' },
  { icon: 'headphones', bgColour: '#161d31' },
  { icon: 'music', bgColour: '#161d31' },
  { icon: 'guitar', bgColour: '#161d31' },
  { icon: 'mic', bgColour: '#161d31' },
  { icon: 'disc', bgColour: '#161d31' },
  { icon: 'sparkles', bgColour: '#161d31' },
  { icon: 'zap', bgColour: '#161d31' },
  { icon: 'radio', bgColour: '#161d31' },
];

export function createDefaultProfile(id?: string, name: string = 'Pianist', avatar?: AvatarConfig): UserProfile {
  const profileId = id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'prof-' + Date.now());
  const now = new Date().toISOString();

  return {
    id: profileId,
    name,
    avatar: avatar || AVATAR_PRESETS[0],
    createdAt: now,
    lastActiveAt: now,
    skillLevel: 'never_played',
    goal: 'both',
    dailyGoalMinutes: 10,
    dailyXpTarget: 60,
    dailyXpEarnedToday: 45,
    dominantHand: 'right',
    reminderTime: '18:30',
    xp: 120,
    level: calculateLevel(120),
    currentStreak: 3,
    longestStreak: 5,
    streakFreezeAvailable: true,
    lastPracticeDate: now.split('T')[0],
    completedLessons: {
      'l1-u1-1': { stars: 3, score: 100, completedAt: now },
      'l1-u1-2': { stars: 3, score: 95, completedAt: now },
    },
    unlockedBadges: ['first_steps', 'streak_starter'],
    practiceHistory: [
      {
        id: 'hist-1',
        date: now.split('T')[0],
        title: 'Finding Middle C',
        durationSeconds: 180,
        xpEarned: 35,
        score: 95,
      },
    ],
    savedProjects: [
      {
        id: 'proj-default-1',
        title: 'Late Night Keys',
        genre: 'lo-fi',
        bpm: 82,
        createdAt: now,
        updatedAt: now,
        gridData: {
          kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
          snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
          hihatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          hihatOpen: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
          perc: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        bassSteps: { 0: 'C2', 6: 'A1', 10: 'F1', 14: 'G1' },
      },
    ],
    settings: DEFAULT_SETTINGS,
  };
}

class StorageService {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_PROFILES)) {
            db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_META)) {
            db.createObjectStore(STORE_META);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Retrieves all user profiles stored locally, seamlessly synchronising IndexedDB and LocalStorage fallback.
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    const fallbackList = this.getFallbackProfiles();
    const db = await this.dbPromise;

    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([STORE_PROFILES], 'readwrite');
          const store = tx.objectStore(STORE_PROFILES);
          const req = store.getAll();

          req.onsuccess = () => {
            const idbList = (req.result as UserProfile[]) || [];
            // Merge by unique ID
            const profileMap = new Map<string, UserProfile>();
            fallbackList.forEach((p) => profileMap.set(p.id, p));
            idbList.forEach((p) => profileMap.set(p.id, p));

            const merged = Array.from(profileMap.values());
            if (merged.length === 0) {
              const def = createDefaultProfile();
              merged.push(def);
            }

            // Sync missing records back into both stores
            merged.forEach((p) => store.put(p));
            try {
              localStorage.setItem('kbr_profiles_list', JSON.stringify(merged));
            } catch {}

            resolve(merged);
          };

          req.onerror = () => resolve(fallbackList);
        } catch {
          resolve(fallbackList);
        }
      });
    }
    return fallbackList;
  }

  /**
   * Retrieves the currently active profile.
   */
  async getActiveProfile(): Promise<UserProfile> {
    const all = await this.getAllProfiles();
    const activeId = this.getActiveProfileId();
    const match = all.find((p) => p.id === activeId);

    if (match) return match;
    if (all.length > 0) {
      this.setActiveProfileId(all[0].id);
      return all[0];
    }

    const defaultProf = createDefaultProfile();
    await this.saveProfile(defaultProf);
    this.setActiveProfileId(defaultProf.id);
    return defaultProf;
  }

  /**
   * Persists an updated profile to IndexedDB and LocalStorage fallback.
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    const updated: UserProfile = {
      ...profile,
      level: calculateLevel(profile.xp),
      lastActiveAt: new Date().toISOString(),
    };

    // Save to LocalStorage fallback
    try {
      const all = this.getFallbackProfiles();
      const idx = all.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        all[idx] = updated;
      } else {
        all.push(updated);
      }
      localStorage.setItem('kbr_profiles_list', JSON.stringify(all));
      localStorage.setItem('kbr_active_profile_id', updated.id);
    } catch {}

    const db = await this.dbPromise;
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction([STORE_PROFILES, STORE_META], 'readwrite');
          const profileStore = tx.objectStore(STORE_PROFILES);
          const metaStore = tx.objectStore(STORE_META);
          profileStore.put(updated);
          metaStore.put(updated.id, 'active_profile_id');
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }

  /**
   * Sets the active profile ID pointer.
   */
  setActiveProfileId(id: string): void {
    try {
      localStorage.setItem('kbr_active_profile_id', id);
    } catch {}

    this.dbPromise.then((db) => {
      if (db) {
        try {
          const tx = db.transaction(STORE_META, 'readwrite');
          tx.objectStore(STORE_META).put(id, 'active_profile_id');
        } catch {}
      }
    });
  }

  getActiveProfileId(): string | null {
    try {
      return localStorage.getItem('kbr_active_profile_id');
    } catch {
      return null;
    }
  }

  /**
   * Creates a new user profile and switches to it.
   */
  async createNewProfile(name: string, avatar: AvatarConfig, goal: any = 'both'): Promise<UserProfile> {
    const newProf = createDefaultProfile(undefined, name, avatar);
    newProf.goal = goal;
    newProf.xp = 0;
    newProf.level = 1;
    newProf.currentStreak = 1;
    newProf.dailyXpEarnedToday = 0;
    newProf.completedLessons = {};
    newProf.practiceHistory = [];
    newProf.unlockedBadges = [];

    await this.saveProfile(newProf);
    this.setActiveProfileId(newProf.id);
    return newProf;
  }

  /**
   * Resets progress for an existing profile.
   */
  async resetProfileProgress(profileId: string): Promise<UserProfile | null> {
    const all = await this.getAllProfiles();
    const target = all.find((p) => p.id === profileId);
    if (!target) return null;

    const reset: UserProfile = {
      ...target,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      dailyXpEarnedToday: 0,
      completedLessons: {},
      practiceHistory: [],
      unlockedBadges: [],
      lastPracticeDate: undefined,
      lastActiveAt: new Date().toISOString(),
    };

    await this.saveProfile(reset);
    return reset;
  }

  /**
   * Deletes a profile.
   */
  async deleteProfile(profileId: string): Promise<void> {
    try {
      const all = this.getFallbackProfiles().filter((p) => p.id !== profileId);
      localStorage.setItem('kbr_profiles_list', JSON.stringify(all));
    } catch {}

    const db = await this.dbPromise;
    if (db) {
      const tx = db.transaction(STORE_PROFILES, 'readwrite');
      tx.objectStore(STORE_PROFILES).delete(profileId);
    }
  }

  /**
   * Generates a portable JSON backup of the user profile.
   */
  exportBackup(profile: UserProfile): string {
    const backup: ProfileBackupData = {
      version: 1,
      app: 'Keys by Ru',
      exportedAt: new Date().toISOString(),
      profile,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Validates and restores a profile from imported backup JSON string.
   */
  async importBackup(jsonString: string): Promise<UserProfile> {
    const parsed = JSON.parse(jsonString) as ProfileBackupData;
    if (!parsed || !parsed.profile || !parsed.profile.id || !parsed.profile.name) {
      throw new Error('Invalid Keys by Ru profile backup format.');
    }

    const importedProfile = parsed.profile;
    importedProfile.lastActiveAt = new Date().toISOString();
    importedProfile.level = calculateLevel(importedProfile.xp);

    await this.saveProfile(importedProfile);
    this.setActiveProfileId(importedProfile.id);
    return importedProfile;
  }

  private getFallbackProfiles(): UserProfile[] {
    try {
      const raw = localStorage.getItem('kbr_profiles_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const initial = createDefaultProfile();
    try {
      localStorage.setItem('kbr_profiles_list', JSON.stringify([initial]));
      localStorage.setItem('kbr_active_profile_id', initial.id);
    } catch {}
    return [initial];
  }
}

export const storage = new StorageService();
