import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, AppSettings, AvatarConfig, SavedProject } from '../types/index.ts';
import { storage, createDefaultProfile } from '../services/storage.ts';
import { evaluateStreakOnPractice, calculateLevel } from '../utils/musicLogic.ts';
import { NeonThemeId, getSavedNeonThemeId, applyNeonTheme } from '../theme/neonThemes.ts';

interface ProfileContextType {
  currentProfile: UserProfile;
  profiles: UserProfile[];
  isLoading: boolean;
  isSaving: boolean;
  saveIndicatorVisible: boolean;
  switchProfile: (profileId: string) => Promise<void>;
  updateProfile: (updater: (prev: UserProfile) => UserProfile) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  createNewProfile: (name: string, avatar: AvatarConfig, goal?: any) => Promise<UserProfile>;
  resetProgress: () => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  addXpAndProgress: (params: {
    xpEarned: number;
    lessonId?: string;
    stars?: number;
    accuracy?: number;
    activityTitle?: string;
    durationSeconds?: number;
  }) => Promise<void>;
  saveProject: (project: SavedProject) => Promise<void>;
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => Promise<boolean>;
  neonThemeId: NeonThemeId;
  setNeonThemeId: (themeId: NeonThemeId) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(createDefaultProfile());
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [neonThemeId, setNeonThemeIdState] = useState<NeonThemeId>(() => getSavedNeonThemeId());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveIndicatorVisible, setSaveIndicatorVisible] = useState<boolean>(false);

  // Apply theme immediately on startup and whenever theme changes
  useEffect(() => {
    applyNeonTheme(neonThemeId);
  }, [neonThemeId]);

  const setNeonThemeId = useCallback((themeId: NeonThemeId) => {
    setNeonThemeIdState(themeId);
    applyNeonTheme(themeId);
    updateProfile((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        neonThemeId: themeId,
      },
    }));
  }, []);

  // Trigger subtle "Saved" indicator in UI
  const triggerSavedToast = useCallback(() => {
    setSaveIndicatorVisible(true);
    const timer = setTimeout(() => {
      setSaveIndicatorVisible(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const [active, all] = await Promise.all([
          storage.getActiveProfile(),
          storage.getAllProfiles(),
        ]);
        setCurrentProfile(active);
        setProfiles(all);
        if (active.settings?.neonThemeId) {
          setNeonThemeIdState(active.settings.neonThemeId);
          applyNeonTheme(active.settings.neonThemeId);
        }
      } catch (err) {
        console.warn('Profile load fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Update and auto-persist profile
  const updateProfile = useCallback(
    async (updater: (prev: UserProfile) => UserProfile) => {
      setIsSaving(true);
      setCurrentProfile((prev) => {
        const next = updater(prev);
        // Persist asynchronously
        storage.saveProfile(next).then(() => {
          storage.getAllProfiles().then((all) => setProfiles(all));
          setIsSaving(false);
          triggerSavedToast();
        });
        return next;
      });
    },
    [triggerSavedToast]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      await updateProfile((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    [updateProfile]
  );

  const switchProfile = useCallback(async (profileId: string) => {
    setIsLoading(true);
    storage.setActiveProfileId(profileId);
    const all = await storage.getAllProfiles();
    setProfiles(all);
    const matched = all.find((p) => p.id === profileId) || all[0];
    if (matched) {
      setCurrentProfile(matched);
    }
    setIsLoading(false);
  }, []);

  const createNewProfile = useCallback(
    async (name: string, avatar: AvatarConfig, goal: any = 'both'): Promise<UserProfile> => {
      setIsSaving(true);
      const newProf = await storage.createNewProfile(name, avatar, goal);
      const all = await storage.getAllProfiles();
      setProfiles(all);
      setCurrentProfile(newProf);
      setIsSaving(false);
      triggerSavedToast();
      return newProf;
    },
    [triggerSavedToast]
  );

  const resetProgress = useCallback(async () => {
    if (!currentProfile.id) return;
    setIsSaving(true);
    const reset = await storage.resetProfileProgress(currentProfile.id);
    if (reset) {
      setCurrentProfile(reset);
      const all = await storage.getAllProfiles();
      setProfiles(all);
      triggerSavedToast();
    }
    setIsSaving(false);
  }, [currentProfile.id, triggerSavedToast]);

  const deleteProfile = useCallback(
    async (profileId: string) => {
      await storage.deleteProfile(profileId);
      const remaining = await storage.getAllProfiles();
      setProfiles(remaining);
      if (currentProfile.id === profileId && remaining.length > 0) {
        await switchProfile(remaining[0].id);
      }
    },
    [currentProfile.id, switchProfile]
  );

  // Auto-record XP, lesson completion, daily goal progress, and streak
  const addXpAndProgress = useCallback(
    async ({
      xpEarned,
      lessonId,
      stars = 3,
      accuracy = 100,
      activityTitle = 'Piano Practise',
      durationSeconds = 60,
    }: {
      xpEarned: number;
      lessonId?: string;
      stars?: number;
      accuracy?: number;
      activityTitle?: string;
      durationSeconds?: number;
    }) => {
      const todayStr = new Date().toISOString().split('T')[0];

      await updateProfile((prev) => {
        const { newStreak, isFirstPracticeToday } = evaluateStreakOnPractice(
          prev.lastPracticeDate,
          prev.currentStreak,
          todayStr
        );

        // Daily XP progress: reset today's earned XP if it is a new day
        const isSameDay = prev.lastPracticeDate === todayStr;
        const currentDailyEarned = isSameDay ? prev.dailyXpEarnedToday : 0;
        const newDailyEarned = currentDailyEarned + xpEarned;

        const newTotalXp = prev.xp + xpEarned;
        const newLevel = calculateLevel(newTotalXp);

        // Completed lessons record
        const nextCompleted = { ...prev.completedLessons };
        if (lessonId) {
          nextCompleted[lessonId] = {
            stars,
            score: accuracy,
            completedAt: new Date().toISOString(),
          };
        }

        // Practice session log
        const newLog = {
          id: 'log-' + Date.now(),
          date: todayStr,
          title: activityTitle,
          durationSeconds,
          xpEarned,
          score: accuracy,
        };

        const updatedHistory = [newLog, ...(prev.practiceHistory || [])].slice(0, 30);

        return {
          ...prev,
          xp: newTotalXp,
          level: newLevel,
          dailyXpEarnedToday: newDailyEarned,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          lastPracticeDate: todayStr,
          completedLessons: nextCompleted,
          practiceHistory: updatedHistory,
        };
      });
    },
    [updateProfile]
  );

  // Save a beat/bass project to profile
  const saveProject = useCallback(
    async (project: SavedProject) => {
      await updateProfile((prev) => {
        const existing = prev.savedProjects || [];
        const index = existing.findIndex((p) => p.id === project.id);
        let nextProjects: SavedProject[];
        if (index >= 0) {
          nextProjects = [...existing];
          nextProjects[index] = { ...project, updatedAt: new Date().toISOString() };
        } else {
          nextProjects = [project, ...existing];
        }
        return {
          ...prev,
          savedProjects: nextProjects,
        };
      });
    },
    [updateProfile]
  );

  const exportBackupJson = useCallback((): string => {
    return storage.exportBackup(currentProfile);
  }, [currentProfile]);

  const importBackupJson = useCallback(
    async (jsonString: string): Promise<boolean> => {
      try {
        const restored = await storage.importBackup(jsonString);
        setCurrentProfile(restored);
        const all = await storage.getAllProfiles();
        setProfiles(all);
        triggerSavedToast();
        return true;
      } catch (err) {
        console.warn('Import failed:', err);
        return false;
      }
    },
    [triggerSavedToast]
  );

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        profiles,
        isLoading,
        isSaving,
        saveIndicatorVisible,
        switchProfile,
        updateProfile,
        updateSettings,
        createNewProfile,
        resetProgress,
        deleteProfile,
        addXpAndProgress,
        saveProject,
        exportBackupJson,
        importBackupJson,
        neonThemeId,
        setNeonThemeId,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
