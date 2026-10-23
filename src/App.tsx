import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, SafeAreaView } from './components/native-ui.tsx';
import { HeaderMissionTimer } from './components/HeaderMissionTimer.tsx';
import { LearnTab } from './components/tabs/LearnTab.tsx';
import { PracticeTab } from './components/tabs/PracticeTab.tsx';
import { CreateTab } from './components/tabs/CreateTab.tsx';
import { ProjectsTab } from './components/tabs/ProjectsTab.tsx';
import { ProfileTab } from './components/tabs/ProfileTab.tsx';
import { LessonModal } from './components/LessonModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { MicrophonePermissionModal } from './components/MicrophonePermissionModal.tsx';
import { ProfileProvider, useProfile } from './context/ProfileContext.tsx';
import { audioEngine } from './audio/audioEngine.ts';
import { Lesson, Song, UserProfile } from './types/index.ts';
import {
  GraduationCap,
  Music,
  PlusCircle,
  FolderKanban,
  User,
} from 'lucide-react';

type TabType = 'learn' | 'practice' | 'create' | 'projects' | 'profile';

function AppContent() {
  const {
    currentProfile,
    profiles,
    isLoading,
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
  } = useProfile();

  const getTabFromHash = (): TabType => {
    if (typeof window === 'undefined') return 'learn';
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const validTabs: TabType[] = ['learn', 'practice', 'create', 'projects', 'profile'];
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'learn';
  };

  const [activeTab, setActiveTabState] = useState<TabType>(getTabFromHash);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetHash = `#/${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }, []);

  // Listen to hashchange events so browser back/forward and relative links work seamlessly
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTabState(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isMuted, setIsMuted] = useState(false);

  // Active overlays
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [selectedSongForPractice, setSelectedSongForPractice] = useState<Song | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMicPrompt, setShowMicPrompt] = useState(false);

  // Check onboarding on initial load
  useEffect(() => {
    if (!isLoading) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!localStorage.getItem('kbr_onboarded') && urlParams.get('autostart') !== '1') {
        setShowOnboarding(true);
      }
    }
  }, [isLoading]);

  const handleLessonSelect = (lesson: Lesson) => {
    audioEngine.ensureAudioContext();
    setActiveLesson(lesson);
  };

  const handleSongSelect = (song: Song) => {
    audioEngine.ensureAudioContext();
    setSelectedSongForPractice(song);
    setActiveTab('practice');
  };

  const handleLessonComplete = (lessonId: string, stars: number, xpEarned: number) => {
    addXpAndProgress({
      xpEarned,
      lessonId,
      stars,
      accuracy: 100,
      activityTitle: 'Lesson Mastery',
    });
  };

  const handleEarnXp = (amount: number) => {
    addXpAndProgress({
      xpEarned: amount,
      activityTitle: activeTab === 'create' ? 'Beat Creation' : 'Song Practise',
    });
  };

  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    localStorage.setItem('kbr_onboarded', 'true');
    updateProfile(() => updatedProfile);
    setShowOnboarding(false);
    audioEngine.ensureAudioContext();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex flex-col items-center justify-center bg-[#0B0710] text-white">
        <Text className="text-white font-bold text-sm font-heading">Initialising Keys by Ru Studio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex flex-col h-screen w-screen bg-[#0B0710] text-slate-100 overflow-hidden select-none">
      {/* Top Header with DAILY GOAL RING and ACTIVE MISSION TIMER placed DEAD CENTRE ON THE SCREEN */}
      <HeaderMissionTimer
        xp={currentProfile.xp}
        streak={currentProfile.currentStreak}
        dailyXpEarnedToday={currentProfile.dailyXpEarnedToday || 0}
        dailyXpTarget={currentProfile.dailyXpTarget || 60}
        onAdjustDailyTarget={(newTarget) =>
          updateProfile((p) => ({ ...p, dailyXpTarget: newTarget }))
        }
        profileName={currentProfile.name}
        profileAvatar={currentProfile.avatar}
        onProfilePress={() => setActiveTab('profile')}
        saveIndicatorVisible={saveIndicatorVisible}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        activeMissionName={
          activeTab === 'learn'
            ? 'Foundations Programme'
            : activeTab === 'practice'
            ? 'Active Practice Session'
            : activeTab === 'create'
            ? 'Music Production Lab'
            : activeTab === 'projects'
            ? 'Studio Mastering & Vocals'
            : 'Pianist Profile'
        }
      />

      {/* Main Tab View Content */}
      <View className="flex-1 w-full overflow-hidden flex flex-col relative">
        {activeTab === 'learn' && (
          <LearnTab
            userProfile={currentProfile}
            onSelectLesson={handleLessonSelect}
            onSelectSong={handleSongSelect}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeTab
            userProfile={currentProfile}
            initialSong={selectedSongForPractice}
            onMicRequest={() => setShowMicPrompt(true)}
            onEarnXp={handleEarnXp}
          />
        )}

        {activeTab === 'create' && (
          <CreateTab
            onEarnXp={handleEarnXp}
            onSaveProject={saveProject}
            savedProjects={currentProfile.savedProjects}
          />
        )}

        {activeTab === 'projects' && <ProjectsTab onEarnXp={handleEarnXp} />}

        {activeTab === 'profile' && (
          <ProfileTab
            userProfile={currentProfile}
            profiles={profiles}
            onUpdateSettings={updateSettings}
            onUpdateProfile={updateProfile}
            onSwitchProfile={switchProfile}
            onCreateNewProfile={createNewProfile}
            onResetProgress={resetProgress}
            onDeleteProfile={deleteProfile}
            onExportBackup={exportBackupJson}
            onImportBackup={importBackupJson}
            onToggleStreakFreeze={() =>
              updateProfile((p) => ({
                ...p,
                streakFreezeAvailable: !p.streakFreezeAvailable,
              }))
            }
          />
        )}
      </View>

      {/* Native-feeling iPhone Bottom Tab Navigation Bar (48px+ touch targets) */}
      <View
        className="w-full bg-[#161021]/95 backdrop-blur-xl px-3 py-1 flex flex-row items-center justify-around z-30 shrink-0"
        style={{ borderTop: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.2)' }}
      >
        {[
          { id: 'learn', label: 'Learn', icon: GraduationCap },
          { id: 'practice', label: 'Practice', icon: Music },
          { id: 'create', label: 'Create', icon: PlusCircle },
          { id: 'projects', label: 'Projects', icon: FolderKanban },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                audioEngine.ensureAudioContext();
                setActiveTab(tab.id as TabType);
              }}
              className="flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all"
              accessibilityLabel={`Navigation Tab ${tab.label}`}
            >
              <IconComp
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110' : 'text-slate-400'
                }`}
                style={
                  isActive
                    ? {
                        color: 'var(--brand-primary)',
                        filter: 'drop-shadow(0 0 6px var(--brand-primary))',
                      }
                    : {}
                }
              />
              <Text
                className="text-[10px] tracking-tight font-heading transition-colors"
                style={{
                  color: isActive ? 'var(--brand-primary)' : '#94A3B8',
                  fontWeight: isActive ? '700' : '500',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lesson Interactive Modal */}
      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          streak={currentProfile.currentStreak}
          onClose={() => setActiveLesson(null)}
          onLessonComplete={handleLessonComplete}
          colourCodedNotes={currentProfile.settings.colourCodedNotes}
          showNoteNames={currentProfile.settings.showNoteNames}
        />
      )}

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={currentProfile}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Microphone Permission Explanatory Dialog */}
      {showMicPrompt && (
        <MicrophonePermissionModal
          onConfirm={() => setShowMicPrompt(false)}
          onCancel={() => setShowMicPrompt(false)}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  );
}
