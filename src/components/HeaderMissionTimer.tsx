import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { DailyGoalRing } from './DailyGoalRing.tsx';
import { Flame, Sparkles, Timer as TimerIcon, Volume2, VolumeX, CheckCircle2, Palette, Check } from 'lucide-react';
import { formatDuration } from '../utils/musicLogic.ts';
import { AvatarConfig } from '../types/index.ts';
import { Logo } from './Logo.tsx';
import { useProfile } from '../context/ProfileContext.tsx';
import { NEON_THEME_LIST, NeonThemeId } from '../theme/neonThemes.ts';

interface HeaderMissionTimerProps {
  xp: number;
  streak: number;
  isMuted: boolean;
  onToggleMute: () => void;
  activeMissionName?: string;
  isTimerRunning?: boolean;
  dailyXpEarnedToday: number;
  dailyXpTarget: number;
  onAdjustDailyTarget?: (newTarget: number) => void;
  profileName: string;
  profileAvatar: AvatarConfig;
  onProfilePress?: () => void;
  saveIndicatorVisible?: boolean;
}

export const HeaderMissionTimer: React.FC<HeaderMissionTimerProps> = ({
  xp,
  streak,
  isMuted,
  onToggleMute,
  activeMissionName = 'Daily Practice Programme',
  isTimerRunning = true,
  dailyXpEarnedToday,
  dailyXpTarget,
  onAdjustDailyTarget,
  profileName,
  onProfilePress,
  saveIndicatorVisible = false,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { neonThemeId, setNeonThemeId } = useProfile();

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  return (
    <View
      className="w-full bg-[#0B0710]/95 backdrop-blur-md px-3 py-2 flex flex-row items-center justify-between z-30 shrink-0 relative"
      style={{ borderBottom: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.2)' }}
    >
      {/* Left: Brand Identity & Active Profile */}
      <View className="flex flex-row items-center gap-2 shrink-0 z-10">
        <Pressable
          onPress={onProfilePress}
          className="flex flex-row items-center gap-2 p-0.5 rounded-xl hover:bg-white/5 transition-colors"
          accessibilityLabel={`Active Profile: ${profileName}. Open profile options`}
        >
          <Logo size={32} showBackground={true} glow={true} />
          <View className="hidden sm:flex flex-col leading-none">
            <Text className="text-white font-bold text-xs font-heading tracking-tight truncate max-w-[85px]">
              {profileName}
            </Text>
            <Text
              className="text-[9px] font-semibold leading-none transition-colors"
              style={{ color: 'var(--brand-primary)' }}
            >
              Keys by Ru
            </Text>
          </View>
        </Pressable>

        {/* Subtle Auto-Save Status Badge */}
        {saveIndicatorVisible && (
          <View className="flex flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 animate-fade-in">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <Text className="text-[9px] font-bold text-emerald-300">Saved</Text>
          </View>
        )}
      </View>

      {/* DEAD CENTRE ON THE SCREEN: Active Mission Timer */}
      <View className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
        <View
          className="flex flex-row items-center gap-1.5 px-3 py-0.5 rounded-full transition-all"
          style={{
            backgroundColor: 'var(--surface-elevated, #161021)',
            border: '1px solid var(--brand-primary)',
            boxShadow: 'var(--brand-glow)',
          }}
        >
          <TimerIcon className="w-3 h-3 animate-pulse" style={{ color: 'var(--brand-primary)' }} />
          <Text
            className="font-mono text-xs font-bold tracking-wider tabular-nums transition-colors"
            style={{ color: 'var(--brand-primary)' }}
          >
            {formatDuration(seconds)}
          </Text>
        </View>
        <Text className="text-[9px] text-slate-300 font-medium tracking-tight mt-0.5 max-w-[120px] truncate text-center hidden xs:block">
          {activeMissionName}
        </Text>
      </View>

      {/* Right: Daily Goal Progress Ring, Streak, XP, Palette Switcher, Volume */}
      <View className="flex flex-row items-center gap-1.5 shrink-0 z-10">
        {/* Daily Goal Visual Progress Ring */}
        <DailyGoalRing
          earnedToday={dailyXpEarnedToday}
          dailyTarget={dailyXpTarget}
          size={28}
          onAdjustTarget={onAdjustDailyTarget}
        />

        {/* Streak Indicator */}
        <View className="flex flex-row items-center gap-0.5 px-1.5 py-0.5 bg-amber-950/60 border border-amber-500/30 rounded-md">
          <Flame className="w-3 h-3 text-amber-500" />
          <Text className="text-amber-300 font-bold text-[11px]">{streak}</Text>
        </View>

        {/* XP Total */}
        <View className="hidden xs:flex flex-row items-center gap-0.5 px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <Text className="text-emerald-300 font-bold text-[11px]">{xp}</Text>
        </View>

        {/* Studio Glow Theme Quick Palette Switcher */}
        <Pressable
          onPress={() => setIsPaletteOpen((prev) => !prev)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{
            backgroundColor: isPaletteOpen ? 'var(--brand-primary)' : '#161021',
            border: '1px solid var(--brand-primary)',
            boxShadow: isPaletteOpen ? 'var(--brand-glow)' : 'none',
          }}
          accessibilityLabel="Customise Studio Glow Colour"
        >
          <Palette
            className="w-3.5 h-3.5 transition-colors"
            style={{ color: isPaletteOpen ? '#0B0710' : 'var(--brand-primary)' }}
          />
        </Pressable>

        {/* Sound Mute */}
        <Pressable
          onPress={onToggleMute}
          className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800"
          accessibilityLabel={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-300" />
          )}
        </Pressable>
      </View>

      {/* Palette Popover Modal / Dropdown */}
      {isPaletteOpen && (
        <View
          className="absolute right-3 top-12 w-64 rounded-2xl p-3 z-50 shadow-2xl backdrop-blur-xl animate-fade-in"
          style={{
            backgroundColor: '#0B0710EE',
            border: '1px solid var(--brand-primary)',
            boxShadow: 'var(--brand-glow)',
          }}
        >
          <View className="flex flex-row items-center justify-between pb-2 mb-2 border-b border-white/10">
            <View className="flex flex-row items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
              <Text className="text-white text-xs font-bold font-heading">
                Studio Glow Colour
              </Text>
            </View>
            <Pressable
              onPress={() => setIsPaletteOpen(false)}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
            >
              <Text className="text-[10px] text-slate-400">Close</Text>
            </Pressable>
          </View>

          <Text className="text-[10px] text-slate-400 mb-2">
            Select a glowing neon palette for the piano, falling notes, and studio interface:
          </Text>

          <View className="flex flex-col gap-1.5">
            {NEON_THEME_LIST.map((theme) => {
              const isSelected = theme.id === neonThemeId;
              return (
                <Pressable
                  key={theme.id}
                  onPress={() => {
                    setNeonThemeId(theme.id);
                    setIsPaletteOpen(false);
                  }}
                  className="flex flex-row items-center justify-between p-1.5 rounded-xl transition-all"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: isSelected ? `1px solid ${theme.primary}` : '1px solid transparent',
                  }}
                >
                  <View className="flex flex-row items-center gap-2">
                    <View
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: theme.previewGrad,
                        boxShadow: `0 0 8px ${theme.primary}80`,
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </View>
                    <View className="flex flex-col">
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: isSelected ? theme.primary : '#F1F5F9' }}
                      >
                        {theme.name}
                      </Text>
                      <Text className="text-[9px] text-slate-400 truncate max-w-[150px]">
                        {theme.description}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

