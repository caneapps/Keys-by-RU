import React, { useState } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { calculateDailyProgress } from '../utils/musicLogic.ts';
import { Target, Check, Sparkles, X } from 'lucide-react';

interface DailyGoalRingProps {
  earnedToday: number;
  dailyTarget: number;
  size?: number; // default 32px
  onAdjustTarget?: (newTarget: number) => void;
}

export const DailyGoalRing: React.FC<DailyGoalRingProps> = ({
  earnedToday,
  dailyTarget,
  size = 32,
  onAdjustTarget,
}) => {
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const { percent, clampedPercent, isGoalReached, remainingXp } = calculateDailyProgress(
    earnedToday,
    dailyTarget
  );

  // Conic gradient ring calculation
  const ringDegrees = clampedPercent * 3.6;
  const ringColour = isGoalReached ? '#10b981' : '#8b5cf6'; // emerald or violet

  return (
    <>
      <Pressable
        onPress={() => setShowDetailModal(true)}
        className="flex flex-row items-center gap-1.5 p-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all"
        accessibilityLabel={`Daily Goal Progress: ${percent}%, ${earnedToday} of ${dailyTarget} XP earned today`}
      >
        {/* Progress Ring Visual */}
        <View
          className="rounded-full flex items-center justify-center relative p-[2.5px] shadow-sm"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `conic-gradient(${ringColour} ${ringDegrees}deg, #1e293b 0deg)`,
          }}
        >
          {/* Inner cutout hole to form ring */}
          <View className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            {isGoalReached ? (
              <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
            ) : (
              <Text className="text-[9px] font-black font-mono text-violet-300">
                {clampedPercent}
                <Text className="text-[7px] text-violet-400">%</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Compact Label for Desktop / Tablet Viewports */}
        <View className="hidden md:flex flex-col text-left leading-none">
          <Text className="text-[9px] text-slate-400 font-medium">Daily Goal</Text>
          <Text className="text-[10px] font-bold text-slate-200 font-mono">
            {earnedToday}/{dailyTarget} <Text className="text-violet-400 text-[9px]">XP</Text>
          </Text>
        </View>
      </Pressable>

      {/* Interactive Detail Modal on Tap */}
      {showDetailModal && (
        <View className="fixed inset-0 z-50 bg-[#060912]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <View className="w-full max-w-xs bg-[#0e1424] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
            <View className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
              <View className="flex flex-row items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                <Text className="text-white font-bold text-sm">Daily Practice Target</Text>
              </View>
              <Pressable
                onPress={() => setShowDetailModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10"
                accessibilityLabel="Close Dialog"
              >
                <X className="w-3.5 h-3.5 text-slate-300" />
              </Pressable>
            </View>

            {/* Central Progress Visualisation */}
            <View className="flex flex-col items-center justify-center py-2 gap-1.5">
              <View
                className="rounded-full flex items-center justify-center p-1.5 shadow-lg relative"
                style={{
                  width: '76px',
                  height: '76px',
                  background: `conic-gradient(${ringColour} ${ringDegrees}deg, #1e293b 0deg)`,
                }}
              >
                <View className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center">
                  <Text className="text-sm font-black text-white font-mono">
                    {earnedToday}
                  </Text>
                  <Text className="text-[9px] text-slate-400 font-medium">/ {dailyTarget} XP</Text>
                </View>
              </View>

              <Text className="text-xs font-bold text-white mt-1">
                {isGoalReached
                  ? 'Daily Goal Achieved!'
                  : `${remainingXp} XP remaining to complete today's programme`}
              </Text>
              <Text className="text-[11px] text-slate-400 text-center leading-relaxed">
                {isGoalReached
                  ? 'Brilliant dedication! Your daily streak has been maintained and your muscle memory is strengthening.'
                  : 'Play piano lessons or practise song melodies to earn XP and complete your ring.'}
              </Text>
            </View>

            {/* Quick adjust target buttons */}
            {onAdjustTarget && (
              <View className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
                <Text className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Adjust Daily Target:
                </Text>
                <View className="grid grid-cols-4 gap-1.5">
                  {[30, 60, 100, 150].map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => onAdjustTarget(t)}
                      className={`py-1.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        dailyTarget === t
                          ? 'bg-violet-600 border-violet-400 text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Text className="text-xs font-bold text-white">{t} XP</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Pressable
              onPress={() => setShowDetailModal(false)}
              className="mt-1 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-violet-600/30 transition-all"
            >
              <Text className="text-white font-bold text-xs">Continue Practising</Text>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
};
