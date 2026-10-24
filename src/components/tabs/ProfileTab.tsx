import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from '../native-ui.tsx';
import { UserProfile, AppSettings, AvatarConfig } from '../../types/index.ts';
import { AVATAR_PRESETS } from '../../services/storage.ts';
import { AvatarDisplay, AVATAR_ICON_MAP } from '../AvatarDisplay.tsx';
import {
  Flame,
  Award,
  Sparkles,
  ShieldAlert,
  Calendar,
  Settings,
  Users,
  Plus,
  Edit3,
  RotateCcw,
  Download,
  Upload,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Target,
  Smartphone,
  Share2,
  Piano,
  LucideIcon,
  Palette,
} from 'lucide-react';
import { Logo } from '../Logo.tsx';
import { useProfile } from '../../context/ProfileContext.tsx';
import { NEON_THEMES, NEON_THEME_LIST } from '../../theme/neonThemes.ts';
import { WeeklyProgressChart } from '../WeeklyProgressChart.tsx';

interface ProfileTabProps {
  userProfile: UserProfile;
  profiles: UserProfile[];
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateProfile: (updater: (prev: UserProfile) => UserProfile) => void;
  onSwitchProfile: (profileId: string) => void;
  onCreateNewProfile: (name: string, avatar: AvatarConfig, goal?: any) => Promise<UserProfile>;
  onResetProgress: () => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onExportBackup: () => string;
  onImportBackup: (jsonString: string) => Promise<boolean>;
  onToggleStreakFreeze: () => void;
}

const MONOCHROME_AVATAR_LIST = [
  { id: 'piano', label: 'Piano', iconName: 'piano' },
  { id: 'headphones', label: 'Headphones', iconName: 'headphones' },
  { id: 'music', label: 'Music', iconName: 'music' },
  { id: 'guitar', label: 'Guitar', iconName: 'guitar' },
  { id: 'mic', label: 'Mic', iconName: 'mic' },
  { id: 'disc', label: 'Disc', iconName: 'disc' },
  { id: 'sparkles', label: 'Sparkles', iconName: 'sparkles' },
  { id: 'zap', label: 'Zap', iconName: 'zap' },
  { id: 'radio', label: 'Radio', iconName: 'radio' },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  profiles,
  onUpdateSettings,
  onUpdateProfile,
  onSwitchProfile,
  onCreateNewProfile,
  onResetProgress,
  onDeleteProfile,
  onExportBackup,
  onImportBackup,
  onToggleStreakFreeze,
}) => {
  const { settings } = userProfile;
  const { neonThemeId, setNeonThemeId } = useProfile();
  const currentTheme = NEON_THEMES[neonThemeId] || NEON_THEMES['signature-pink'];

  // Modals state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState<string>(userProfile.name);
  const [editAvatar, setEditAvatar] = useState<AvatarConfig>(userProfile.avatar);
  const [editDailyGoalMinutes, setEditDailyGoalMinutes] = useState<number>(userProfile.dailyGoalMinutes);
  const [editDailyXpTarget, setEditDailyXpTarget] = useState<number>(userProfile.dailyXpTarget || 60);

  // Create form state
  const [newName, setNewName] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<AvatarConfig>(AVATAR_PRESETS[1]);

  const BADGES = [
    { id: 'first_steps', title: 'First Touch', desc: 'Completed first piano lesson', icon: 'piano' },
    { id: 'streak_starter', title: 'Daily Devotion', desc: 'Maintained 3-day practice streak', icon: 'zap' },
    { id: 'scale_master', title: 'Scale Explorer', desc: 'Mastered C Major 5-finger scale', icon: 'sparkles' },
    { id: 'beat_architect', title: 'Beat Architect', desc: 'Constructed first 16-step beat', icon: 'disc' },
  ];

  const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleSaveEdit = () => {
    onUpdateProfile((prev) => ({
      ...prev,
      name: editName.trim() || 'Pianist',
      avatar: editAvatar,
      dailyGoalMinutes: editDailyGoalMinutes,
      dailyXpTarget: editDailyXpTarget,
    }));
    setShowEditModal(false);
  };

  const handleCreateProfileSubmit = async () => {
    if (!newName.trim()) return;
    await onCreateNewProfile(newName.trim(), newAvatar);
    setNewName('');
    setShowCreateModal(false);
  };

  const handleConfirmReset = async () => {
    await onResetProgress();
    setShowResetConfirmModal(false);
  };

  const handleExportClick = () => {
    const json = onExportBackup();
    const cleanName = userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `keys_by_ru_${cleanName}_backup.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          const success = await onImportBackup(text);
          if (success) {
            setImportStatusMessage('Profile restored successfully!');
          } else {
            setImportStatusMessage('Failed to restore. Please ensure valid JSON backup file.');
          }
          setTimeout(() => setImportStatusMessage(null), 3500);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <ScrollView className="w-full flex-1 p-4 pb-28 gap-5">
      {/* Active Profile Header Card */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-3.5">
            <AvatarDisplay
              avatar={userProfile.avatar}
              size="xl"
              className="bg-white/5 border border-white/10 text-[#FF1E8E] shadow-md"
              iconClassName="text-[#FF1E8E] stroke-[2.2]"
            />
            <View className="flex flex-col">
              <View className="flex flex-row items-center gap-2">
                <Text className="text-white font-bold text-base tracking-tight">{userProfile.name}</Text>
                <View className="px-2.5 py-0.5 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
                  <Text className="text-[10px] font-bold text-[#FF1E8E]">Level {userProfile.level}</Text>
                </View>
              </View>
              <Text className="text-slate-400 text-xs font-medium mt-0.5">
                Goal: {userProfile.dailyXpTarget || 60} XP · {userProfile.dailyGoalMinutes} min/day
              </Text>
            </View>
          </View>

          <View className="flex flex-col items-end gap-1.5">
            <View className="flex flex-row items-center gap-1">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              <Text className="text-white font-black text-lg tabular-nums">{userProfile.xp}</Text>
            </View>
            <Pressable
              onPress={() => {
                setEditName(userProfile.name);
                setEditAvatar(userProfile.avatar);
                setEditDailyGoalMinutes(userProfile.dailyGoalMinutes);
                setEditDailyXpTarget(userProfile.dailyXpTarget || 60);
                setShowEditModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-row items-center gap-1.5 transition-colors"
              accessibilityLabel="Edit Profile Details"
            >
              <Edit3 className="w-3 h-3 text-slate-300" />
              <Text className="text-[11px] font-semibold text-slate-300">Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Streak & Streak Freeze */}
        <View className="flex flex-row items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <View className="flex flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#F59E0B]" />
            </View>
            <View className="flex flex-col">
              <Text className="text-white font-bold text-xs">
                {userProfile.currentStreak} Day Practice Streak!
              </Text>
              <Text className="text-slate-400 text-[10px]">
                Longest: {userProfile.longestStreak} days
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onToggleStreakFreeze}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex flex-row items-center gap-1 transition-all ${
              userProfile.streakFreezeAvailable
                ? 'bg-[#B829FF]/20 border-[#B829FF]/50 text-[#B829FF] shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <Text className="text-xs text-white">
              {userProfile.streakFreezeAvailable ? 'Freeze Active' : 'Get Freeze'}
            </Text>
          </Pressable>
        </View>

        {/* Practice Calendar (Weekly Programme) */}
        <View className="flex flex-col gap-2 pt-1">
          <View className="flex flex-row items-center justify-between text-xs">
            <View className="flex flex-row items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <Text className="text-xs text-slate-300 font-medium">This Week&apos;s Programme:</Text>
            </View>
            <Text className="text-[11px] text-[#10B981] font-semibold">100% on track</Text>
          </View>

          <View className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day, idx) => {
              const isDone = idx < userProfile.currentStreak;
              return (
                <View
                  key={day}
                  className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                    isDone
                      ? 'bg-emerald-950/60 border-[#10B981]/40 text-[#10B981]'
                      : 'bg-white/[0.03] border-white/10 text-slate-500'
                  }`}
                >
                  <Text className="text-[10px] font-bold text-slate-400">{day}</Text>
                  <View
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      isDone ? 'bg-[#10B981]' : 'bg-slate-800'
                    }`}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 text-black" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Weekly Progress Recharts Chart: Daily XP Targets vs. Actuals */}
      <WeeklyProgressChart
        userProfile={userProfile}
        onAdjustTarget={() => {
          setEditName(userProfile.name);
          setEditAvatar(userProfile.avatar);
          setEditDailyGoalMinutes(userProfile.dailyGoalMinutes);
          setEditDailyXpTarget(userProfile.dailyXpTarget || 60);
          setShowEditModal(true);
        }}
      />

      {/* Account Switcher Section (Multi-Profile Support) */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm">Musician Profiles ({profiles.length})</Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FF1E8E] hover:opacity-90 flex flex-row items-center gap-1.5 text-white shadow-sm shadow-[#FF1E8E]/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <Text className="text-xs font-bold text-white">Add Profile</Text>
          </Pressable>
        </View>

        <Text className="text-slate-400 text-xs leading-relaxed">
          Each musician on this device enjoys their own isolated XP, streak, lessons, and beats.
        </Text>

        <View className="flex flex-col gap-2 mt-1">
          {profiles.map((p) => {
            const isActive = p.id === userProfile.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => !isActive && onSwitchProfile(p.id)}
                className={`p-3 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                  isActive
                    ? 'bg-[#23112B]/75 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <View className="flex flex-row items-center gap-3">
                  <AvatarDisplay
                    avatar={p.avatar}
                    size="sm"
                    className="bg-white/5 border border-white/10"
                    iconClassName={isActive ? 'text-[#FF1E8E]' : 'text-slate-400'}
                  />
                  <View className="flex flex-col">
                    <View className="flex flex-row items-center gap-1.5">
                      <Text className="text-white font-bold text-xs">{p.name}</Text>
                      {isActive && (
                        <View className="px-1.5 py-0.2 rounded bg-[#FF1E8E]/20">
                          <Text className="text-[9px] font-bold text-[#FF1E8E]">Active</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[10px] text-slate-400">
                      Level {p.level || 1} · {p.xp} XP · {p.currentStreak}d Streak
                    </Text>
                  </View>
                </View>

                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-[#FF1E8E]" />
                ) : (
                  <Text className="text-xs font-semibold text-slate-400">Switch</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Backup & Restore (Portability for GitHub Pages / iPhone) */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center gap-2">
          <Download className="w-5 h-5 text-[#FF1E8E]" />
          <Text className="text-white font-bold text-sm">Backup &amp; Restore Data</Text>
        </View>

        <Text className="text-slate-400 text-xs leading-relaxed">
          Safeguard your piano lessons, practice history, and beat creations. Export a portable JSON backup file to your iPhone or cloud drive, or restore a previous session.
        </Text>

        {importStatusMessage && (
          <View className="p-3 rounded-xl bg-[#23112B]/80 border border-[#FF1E8E]/40">
            <Text className="text-xs text-white font-medium">{importStatusMessage}</Text>
          </View>
        )}

        <View className="flex flex-row gap-3 pt-1">
          <Pressable
            onPress={handleExportClick}
            className="flex-1 py-3 rounded-2xl bg-[#FF1E8E] hover:opacity-90 text-white font-bold text-xs flex flex-row items-center justify-center gap-1.5 shadow-md shadow-[#FF1E8E]/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <Text className="text-xs font-bold text-white">Export Backup (.json)</Text>
          </Pressable>

          <Pressable
            onPress={handleImportClick}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex flex-row items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-300" />
            <Text className="text-xs font-bold text-white">Import Backup</Text>
          </Pressable>
        </View>
      </View>

      {/* iOS Home Screen Installation Guide */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm">iOS Home Screen Installation</Text>
          </View>
          {typeof window !== 'undefined' &&
          (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) ? (
            <View className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex flex-row items-center gap-1">
              <Check className="w-3 h-3 text-[#10B981]" />
              <Text className="text-[10px] font-bold text-[#10B981]">Standalone Active</Text>
            </View>
          ) : (
            <View className="px-2.5 py-0.5 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
              <Text className="text-[10px] font-bold text-[#FF1E8E]">Apple PWA Ready</Text>
            </View>
          )}
        </View>

        <Text className="text-slate-400 text-xs leading-relaxed">
          Install Keys by Ru directly onto your iPhone home screen for an authentic native experience: full-screen standalone mode, zero browser address bars, low-latency Web Audio, and offline curriculum access.
        </Text>

        <View className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5">
          <View className="flex flex-row items-center gap-2.5">
            <View className="w-6 h-6 rounded-full bg-[#FF1E8E]/20 flex items-center justify-center shrink-0">
              <Text className="text-[#FF1E8E] font-bold text-xs">1</Text>
            </View>
            <View className="flex flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-slate-200 text-xs">Tap the</Text>
              <View className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex flex-row items-center gap-1">
                <Share2 className="w-3 h-3 text-[#FF1E8E]" />
                <Text className="text-xs font-bold text-[#FF1E8E]">Share</Text>
              </View>
              <Text className="text-slate-200 text-xs">button in Safari&apos;s bottom toolbar</Text>
            </View>
          </View>

          <View className="flex flex-row items-center gap-2.5">
            <View className="w-6 h-6 rounded-full bg-[#FF1E8E]/20 flex items-center justify-center shrink-0">
              <Text className="text-[#FF1E8E] font-bold text-xs">2</Text>
            </View>
            <View className="flex flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-slate-200 text-xs">Scroll down and select</Text>
              <View className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <Text className="text-xs font-bold text-[#FF1E8E]">Add to Home Screen</Text>
              </View>
            </View>
          </View>

          <View className="flex flex-row items-center gap-2.5">
            <View className="w-6 h-6 rounded-full bg-[#FF1E8E]/20 flex items-center justify-center shrink-0">
              <Text className="text-[#FF1E8E] font-bold text-xs">3</Text>
            </View>
            <Text className="text-slate-200 text-xs">Launch Keys by Ru from your home screen icon</Text>
          </View>
        </View>
      </View>

      {/* Badges & Achievements */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Award className="w-5 h-5 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm">Badges &amp; Achievements</Text>
          </View>
          <Text className="text-xs text-slate-400">
            {userProfile.unlockedBadges.length} of {BADGES.length} Unlocked
          </Text>
        </View>

        <View className="grid grid-cols-2 gap-3">
          {BADGES.map((b) => {
            const isUnlocked = userProfile.unlockedBadges.includes(b.id);
            const IconComp = AVATAR_ICON_MAP[b.icon] || Award;
            return (
              <View
                key={b.id}
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all ${
                  isUnlocked
                    ? 'bg-[#23112B]/60 border-[#B829FF]/40'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}
              >
                <View className="flex flex-row items-center justify-between">
                  <View className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <IconComp className={`w-4 h-4 ${isUnlocked ? 'text-[#B829FF]' : 'text-slate-500'}`} />
                  </View>
                  {isUnlocked && (
                    <View className="px-2 py-0.5 rounded-full bg-[#B829FF]/20">
                      <Text className="text-[9px] text-[#B829FF] font-bold">Earned</Text>
                    </View>
                  )}
                </View>
                <Text className="text-white font-bold text-xs">{b.title}</Text>
                <Text className="text-slate-400 text-[11px] leading-tight">{b.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Studio Glow Theme Picker Section */}
      <View
        className="rounded-3xl p-5 shadow-xl flex flex-col gap-4 transition-all"
        style={{
          backgroundColor: 'var(--surface-elevated, #161021)',
          border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.3)',
        }}
      >
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Palette className="w-5 h-5 transition-colors" style={{ color: 'var(--brand-primary)' }} />
            <Text className="text-white font-bold text-sm">Studio Glow Theme</Text>
          </View>
          <View
            className="px-2.5 py-0.5 rounded-full flex flex-row items-center gap-1 transition-all"
            style={{
              backgroundColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.15)',
              border: '1px solid var(--brand-primary)',
            }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--brand-glow)' }}
            />
            <Text className="text-[10px] font-bold" style={{ color: 'var(--brand-primary)' }}>
              {currentTheme.name}
            </Text>
          </View>
        </View>

        <Text className="text-slate-400 text-xs leading-relaxed">
          Customise the glowing neon accent colour across the entire studio interface, keyboard keys, falling notes, and release artwork.
        </Text>

        {/* 7 Circular Glowing Colour Swatches */}
        <View className="flex flex-col gap-2 pt-1">
          <Text className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Available Glowing Palettes (7 Presets)
          </Text>
          <View className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
            {NEON_THEME_LIST.map((theme) => {
              const isSelected = theme.id === neonThemeId;
              return (
                <Pressable
                  key={theme.id}
                  onPress={() => setNeonThemeId(theme.id)}
                  className="p-3 rounded-2xl flex flex-col items-center gap-2 transition-all"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? `2px solid ${theme.primary}` : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected ? `0 0 16px ${theme.primary}50` : 'none',
                  }}
                  accessibilityLabel={`Select ${theme.name} colour theme`}
                >
                  <View
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-transform"
                    style={{
                      background: theme.previewGrad,
                      boxShadow: `0 0 12px ${theme.primary}80`,
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </View>
                  <View className="flex flex-col items-center text-center">
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isSelected ? theme.primary : '#F1F5F9' }}
                    >
                      {theme.name}
                    </Text>
                    <Text className="text-[9px] text-slate-400 line-clamp-1 leading-tight">
                      {theme.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Live Studio Preview Card */}
        <View
          className="rounded-2xl p-4 flex flex-col gap-3 mt-1"
          style={{
            backgroundColor: '#0B0710',
            border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.25)',
          }}
        >
          <View className="flex flex-row items-center justify-between border-b border-white/10 pb-2">
            <Text className="text-white text-xs font-bold">Live Theme Preview</Text>
            <Text className="text-[10px] text-slate-400 font-mono">
              Primary: {currentTheme.primary} · Secondary: {currentTheme.secondary}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-around gap-2 py-2 flex-wrap">
            {/* Logo Monogram Preview */}
            <View className="flex flex-col items-center gap-1">
              <Logo size={42} showBackground={true} glow={true} />
              <Text className="text-[10px] text-slate-400 font-medium">Reactive Logo</Text>
            </View>

            {/* Piano Key Highlight Preview */}
            <View className="flex flex-col items-center gap-1">
              <View className="flex flex-row items-end gap-1 p-1.5 rounded-lg bg-[#161021] border border-white/10">
                <View className="w-5 h-12 rounded-b bg-white/20" />
                <View
                  className="w-5 h-12 rounded-b transition-all flex items-center justify-end pb-1"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    boxShadow: 'var(--brand-glow)',
                  }}
                >
                  <Text className="text-[9px] font-bold text-black font-mono">C4</Text>
                </View>
                <View className="w-5 h-12 rounded-b bg-white/20" />
              </View>
              <Text className="text-[10px] text-slate-400 font-medium">Active Key Glow</Text>
            </View>

            {/* Falling Note Lanes Preview */}
            <View className="flex flex-col items-center gap-1">
              <View className="w-16 h-12 rounded-lg bg-[#161021] border border-white/10 p-1 flex flex-row items-end justify-around relative overflow-hidden">
                <View
                  className="w-2.5 h-6 rounded-full"
                  style={{
                    backgroundColor: 'var(--brand-secondary)',
                    boxShadow: '0 0 8px var(--brand-secondary)',
                  }}
                />
                <View
                  className="w-2.5 h-8 rounded-full"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    boxShadow: 'var(--brand-glow)',
                  }}
                />
                {/* Playhead line */}
                <View
                  className="absolute bottom-1 left-0 right-0 h-0.5"
                  style={{ backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--brand-glow)' }}
                />
              </View>
              <Text className="text-[10px] text-slate-400 font-medium">Falling Notes</Text>
            </View>

            {/* UI Button Preview */}
            <View className="flex flex-col items-center gap-1">
              <View
                className="px-3 py-2 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  boxShadow: 'var(--brand-glow)',
                }}
              >
                <Text className="text-[10px] font-bold text-black">Accent Action</Text>
              </View>
              <Text className="text-[10px] text-slate-400 font-medium">Primary Accent</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Accessibility & Keyboard Controls */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        <View className="flex flex-row items-center gap-2">
          <Settings className="w-5 h-5 text-[#FF1E8E]" />
          <Text className="text-white font-bold text-sm">Accessibility &amp; Keyboard Controls</Text>
        </View>

        {/* Note names display */}
        <View className="flex flex-row items-center justify-between py-1">
          <View className="flex flex-col">
            <Text className="text-white font-semibold text-xs">Note Name Labels</Text>
            <Text className="text-slate-400 text-[10px]">Display C, D, E on keys and staff</Text>
          </View>
          <Pressable
            onPress={() => onUpdateSettings({ showNoteNames: !settings.showNoteNames })}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              settings.showNoteNames
                ? 'bg-[#FF1E8E] border-[#FF1E8E] text-white'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Text className="text-xs text-white">{settings.showNoteNames ? 'Enabled' : 'Disabled'}</Text>
          </Pressable>
        </View>

        {/* Colour-coded notes */}
        <View className="flex flex-row items-center justify-between py-1">
          <View className="flex flex-col">
            <Text className="text-white font-semibold text-xs">Colour-Coded Notes</Text>
            <Text className="text-slate-400 text-[10px]">Visual pedagogical aids for pitch memory</Text>
          </View>
          <Pressable
            onPress={() => onUpdateSettings({ colourCodedNotes: !settings.colourCodedNotes })}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              settings.colourCodedNotes
                ? 'bg-[#FF1E8E] border-[#FF1E8E] text-white'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Text className="text-xs text-white">
              {settings.colourCodedNotes ? 'Enabled' : 'Disabled'}
            </Text>
          </Pressable>
        </View>

        {/* Key Size on iPhone */}
        <View className="flex flex-row items-center justify-between py-1">
          <View className="flex flex-col">
            <Text className="text-white font-semibold text-xs">Touch Key Dimensions</Text>
            <Text className="text-slate-400 text-[10px]">Optimise for iPhone touch surfaces</Text>
          </View>
          <View className="flex flex-row gap-1.5">
            {(['compact', 'normal', 'large'] as const).map((size) => (
              <Pressable
                key={size}
                onPress={() => onUpdateSettings({ keySize: size })}
                className={`px-3 py-1.5 rounded-xl text-xs capitalize border transition-all ${
                  settings.keySize === size
                    ? 'bg-[#FF1E8E] border-[#FF1E8E] text-white font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <Text className="text-xs capitalize text-white">{size}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Danger Zone: Reset Profile Progress */}
      <View className="bg-[#161021] border border-rose-950/60 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          <Text className="text-white font-bold text-sm">Danger Zone: Reset Progress</Text>
        </View>
        <Text className="text-slate-400 text-xs leading-relaxed">
          Reset XP, daily streaks, and completed lesson scores for the active profile.
        </Text>
        <Pressable
          onPress={() => setShowResetConfirmModal(true)}
          className="py-2.5 px-4 rounded-xl bg-rose-950/70 border border-[#EF4444]/50 text-rose-300 font-bold text-xs flex flex-row items-center justify-center gap-1.5 hover:bg-rose-900/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#EF4444]" />
          <Text className="text-xs font-bold text-rose-300">Reset Active Profile Progress</Text>
        </Pressable>
      </View>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <View className="fixed inset-0 z-50 bg-[#0B0710]/85 backdrop-blur-md flex items-center justify-center p-4">
          <View className="w-full max-w-sm bg-[#161021] border border-[#FF1E8E]/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <View className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <Text className="text-white font-bold text-base">Edit Musician Profile</Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </Pressable>
            </View>

            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Musician Name:</Text>
              <TextInput value={editName} onChangeText={setEditName} />
            </View>

            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Avatar:</Text>
                <Text className="text-[11px] text-[#FF1E8E] font-medium">Monochrome Icons</Text>
              </View>
              <View className="grid grid-cols-3 gap-2">
                {MONOCHROME_AVATAR_LIST.map((av) => {
                  const IconComp = AVATAR_ICON_MAP[av.iconName] || Piano;
                  const isSelected =
                    editAvatar.icon === av.iconName ||
                    (av.iconName === 'piano' && (editAvatar.icon === 'piano' || editAvatar.icon === '🎹')) ||
                    (av.iconName === 'headphones' && (editAvatar.icon === 'headphones' || editAvatar.icon === '🎧')) ||
                    (av.iconName === 'music' && (editAvatar.icon === 'music' || editAvatar.icon === '🎼' || editAvatar.icon === '🎵')) ||
                    (av.iconName === 'guitar' && (editAvatar.icon === 'guitar' || editAvatar.icon === '🎸')) ||
                    (av.iconName === 'mic' && (editAvatar.icon === 'mic' || editAvatar.icon === '🎙️')) ||
                    (av.iconName === 'disc' && (editAvatar.icon === 'disc' || editAvatar.icon === '🥁')) ||
                    (av.iconName === 'sparkles' && (editAvatar.icon === 'sparkles' || editAvatar.icon === '✨')) ||
                    (av.iconName === 'zap' && (editAvatar.icon === 'zap' || editAvatar.icon === '⚡')) ||
                    (av.iconName === 'radio' && (editAvatar.icon === 'radio' || editAvatar.icon === '📻'));

                  return (
                    <Pressable
                      key={av.id}
                      onPress={() => setEditAvatar({ icon: av.iconName, bgColour: '#161021' })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-[#FF1E8E]/20 border-[#FF1E8E] text-white ring-1 ring-[#FF1E8E]/60 shadow-[0_0_12px_rgba(255,30,142,0.35)] scale-105'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${isSelected ? 'text-[#FF1E8E]' : 'text-slate-400'}`} />
                      <Text className={`text-[10px] font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {av.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Daily XP Goal:</Text>
              <View className="grid grid-cols-4 gap-1.5">
                {[30, 60, 100, 150].map((xpVal) => (
                  <Pressable
                    key={xpVal}
                    onPress={() => setEditDailyXpTarget(xpVal)}
                    className={`py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      editDailyXpTarget === xpVal
                        ? 'bg-[#FF1E8E] border-[#FF1E8E] text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Text className="text-xs font-bold text-white tabular-nums">{xpVal}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex flex-row gap-2.5 mt-2">
              <Pressable
                onPress={() => setShowEditModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs"
              >
                <Text className="text-xs text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-[#FF1E8E] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#FF1E8E]/30 transition-all"
              >
                <Text className="text-xs text-white font-bold">Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Create New Profile Modal */}
      {showCreateModal && (
        <View className="fixed inset-0 z-50 bg-[#0B0710]/85 backdrop-blur-md flex items-center justify-center p-4">
          <View className="w-full max-w-sm bg-[#161021] border border-[#FF1E8E]/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <View className="flex flex-row items-center justify-between pb-3 border-b border-white/10">
              <Text className="text-white font-bold text-base">Add New Musician</Text>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </Pressable>
            </View>

            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Musician Name:</Text>
              <TextInput value={newName} onChangeText={setNewName} placeholder="e.g. Maya or Sam" />
            </View>

            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pick Avatar:</Text>
                <Text className="text-[11px] text-[#FF1E8E] font-medium">Monochrome Icons</Text>
              </View>
              <View className="grid grid-cols-3 gap-2">
                {MONOCHROME_AVATAR_LIST.map((av) => {
                  const IconComp = AVATAR_ICON_MAP[av.iconName] || Piano;
                  const isSelected =
                    newAvatar.icon === av.iconName ||
                    (av.iconName === 'piano' && (newAvatar.icon === 'piano' || newAvatar.icon === '🎹')) ||
                    (av.iconName === 'headphones' && (newAvatar.icon === 'headphones' || newAvatar.icon === '🎧')) ||
                    (av.iconName === 'music' && (newAvatar.icon === 'music' || newAvatar.icon === '🎼' || newAvatar.icon === '🎵')) ||
                    (av.iconName === 'guitar' && (newAvatar.icon === 'guitar' || newAvatar.icon === '🎸')) ||
                    (av.iconName === 'mic' && (newAvatar.icon === 'mic' || newAvatar.icon === '🎙️')) ||
                    (av.iconName === 'disc' && (newAvatar.icon === 'disc' || newAvatar.icon === '🥁')) ||
                    (av.iconName === 'sparkles' && (newAvatar.icon === 'sparkles' || newAvatar.icon === '✨')) ||
                    (av.iconName === 'zap' && (newAvatar.icon === 'zap' || newAvatar.icon === '⚡')) ||
                    (av.iconName === 'radio' && (newAvatar.icon === 'radio' || newAvatar.icon === '📻'));

                  return (
                    <Pressable
                      key={av.id}
                      onPress={() => setNewAvatar({ icon: av.iconName, bgColour: '#161021' })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-[#FF1E8E]/20 border-[#FF1E8E] text-white ring-1 ring-[#FF1E8E]/60 shadow-[0_0_12px_rgba(255,30,142,0.35)] scale-105'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${isSelected ? 'text-[#FF1E8E]' : 'text-slate-400'}`} />
                      <Text className={`text-[10px] font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {av.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="flex flex-row gap-2.5 mt-2">
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs"
              >
                <Text className="text-xs text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateProfileSubmit}
                disabled={!newName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#FF1E8E] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#FF1E8E]/30 transition-all"
              >
                <Text className="text-xs text-white font-bold">Create Profile</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Confirmation Modal for Resetting Progress */}
      {showResetConfirmModal && (
        <View className="fixed inset-0 z-50 bg-[#0B0710]/85 backdrop-blur-md flex items-center justify-center p-4">
          <View className="w-full max-w-sm bg-[#161021] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-3.5">
            <View className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            </View>

            <Text className="text-white font-bold text-base">Reset All Progress?</Text>
            <Text className="text-slate-300 text-xs leading-relaxed">
              This will reset XP, streaks, and completed lesson stars for{' '}
              <Text className="font-bold text-white">{userProfile.name}</Text>. Saved projects and other profiles will remain intact.
            </Text>

            <View className="flex flex-row gap-2.5 mt-2">
              <Pressable
                onPress={() => setShowResetConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs"
              >
                <Text className="text-xs text-slate-300 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center shadow transition-colors"
              >
                <Text className="text-xs text-white font-bold">Yes, Reset Progress</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
