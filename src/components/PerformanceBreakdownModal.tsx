/**
 * Performance Breakdown & Pedagogical Heatmap Modal for Keys by Ru.
 * Displays:
 * - Session accuracy score, star tier, and timing distribution
 * - Visual bar-by-bar error heatmap
 * - 1-Tap "Loop Problem Bars (Slow 60%)" action
 * - Gemini AI Coach pedagogical critique
 *
 * Exclusively built with React Native primitives (View, Text, Pressable, ScrollView).
 * ZERO HTML tags. Strict British English.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from './native-ui.tsx';
import { SessionTelemetry, BarPerformanceSummary } from '../services/performanceGrader.ts';
import { geminiCoach } from '../services/gemini.ts';
import {
  Award,
  Star,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Timer,
  Zap,
  Play,
  X,
  TrendingUp,
} from 'lucide-react';

interface PerformanceBreakdownModalProps {
  telemetry: SessionTelemetry;
  onClose: () => void;
  onLoopProblemBars: (bars: number[], tempoSpeedPercent: number) => void;
  onRestartFullPiece: () => void;
}

export const PerformanceBreakdownModal: React.FC<PerformanceBreakdownModalProps> = ({
  telemetry,
  onClose,
  onLoopProblemBars,
  onRestartFullPiece,
}) => {
  const [coachAnalysis, setCoachAnalysis] = useState<string>('');
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(true);
  const [selectedBar, setSelectedBar] = useState<BarPerformanceSummary | null>(
    telemetry.barSummaries.find((b) => b.accuracyPercent < 80) || telemetry.barSummaries[0] || null
  );

  useEffect(() => {
    let isMounted = true;
    const fetchCoachReview = async () => {
      setIsLoadingCoach(true);
      try {
        const critique = await geminiCoach.analyzeSessionTelemetry(telemetry);
        if (isMounted) {
          setCoachAnalysis(critique);
        }
      } catch (err) {
        if (isMounted) {
          setCoachAnalysis(
            "Solid performance! Keep your wrists supple and anticipate finger shifts before the bar line."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCoach(false);
        }
      }
    };

    fetchCoachReview();
    return () => {
      isMounted = false;
    };
  }, [telemetry]);

  const hasWeakBars = telemetry.weakBars.length > 0;

  return (
    <View className="fixed inset-0 z-50 bg-[#0B0710]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <View
        className="w-full max-w-xl max-h-[90vh] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in"
        style={{
          backgroundColor: '#161021',
          border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.35)',
          boxShadow: 'var(--brand-glow)',
        }}
      >
        {/* Header */}
        <View className="flex flex-row items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <View className="flex flex-row items-center gap-2.5">
            <View
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.15)',
                border: '1px solid var(--brand-primary)',
              }}
            >
              <Award className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
            </View>
            <View className="flex flex-col">
              <Text className="text-white font-black text-base font-heading">
                Performance Telemetry
              </Text>
              <Text className="text-slate-400 text-xs">
                {telemetry.songOrLessonTitle} · {telemetry.mode === 'tempo' ? `${telemetry.bpm} BPM` : 'Wait Mode'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
            accessibilityLabel="Close Telemetry Breakdown"
          >
            <X className="w-4 h-4 text-slate-300" />
          </Pressable>
        </View>

        {/* Scrollable Metrics & Heatmap Area */}
        <ScrollView className="flex-1 my-3 pr-1 flex flex-col gap-4 overflow-y-auto">
          {/* Top Key Performance Metrics */}
          <View className="grid grid-cols-3 gap-2">
            {/* Accuracy */}
            <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center">
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Accuracy
              </Text>
              <Text
                className="text-xl font-black font-heading mt-0.5"
                style={{
                  color:
                    telemetry.accuracyPercent >= 90
                      ? '#10B981'
                      : telemetry.accuracyPercent >= 75
                      ? '#F59E0B'
                      : '#EF4444',
                }}
              >
                {telemetry.accuracyPercent}%
              </Text>
              <View className="flex flex-row gap-0.5 mt-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= telemetry.stars
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </View>
            </View>

            {/* Timing Balance */}
            <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center">
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Precision
              </Text>
              <Text className="text-white text-xl font-black font-heading mt-0.5">
                {telemetry.timingBreakdown.perfect}
                <Text className="text-emerald-400 text-xs font-semibold">
                  /{telemetry.totalExpectedNotes}
                </Text>
              </Text>
              <Text className="text-slate-400 text-[10px] mt-1 font-mono">
                {telemetry.timingBreakdown.early} early · {telemetry.timingBreakdown.late} late
              </Text>
            </View>

            {/* Average Hesitation */}
            <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center">
              <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Avg Hesitation
              </Text>
              <Text className="text-white text-xl font-black font-heading mt-0.5">
                {telemetry.averageHesitationMs}
                <Text className="text-slate-400 text-xs">ms</Text>
              </Text>
              <Text className="text-emerald-400 text-[10px] mt-1 font-semibold">
                {telemetry.averageHesitationMs < 450 ? 'Fluid Tempo' : 'Building Reflex'}
              </Text>
            </View>
          </View>

          {/* Visual Heatmap by Bar */}
          <View className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2.5">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF1E8E]" />
                <Text className="text-white text-xs font-bold font-heading">
                  Bar-by-Bar Mastery Heatmap
                </Text>
              </View>
              <Text className="text-slate-400 text-[10px]">
                Tap any bar to inspect notes & timing
              </Text>
            </View>

            {/* Heatmap Grid */}
            <View className="flex flex-row flex-wrap gap-2">
              {telemetry.barSummaries.map((bar) => {
                const isSelected = selectedBar?.barNumber === bar.barNumber;
                const isWeak = bar.accuracyPercent < 80;
                return (
                  <Pressable
                    key={bar.barNumber}
                    onPress={() => setSelectedBar(bar)}
                    className={`flex-1 min-w-[58px] p-2 rounded-xl flex flex-col items-center border transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#FF1E8E] border-white/40'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor:
                        bar.accuracyPercent >= 90
                          ? 'rgba(16, 185, 129, 0.18)'
                          : bar.accuracyPercent >= 70
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(239, 68, 68, 0.22)',
                    }}
                  >
                    <Text className="text-slate-300 text-[10px] font-bold">
                      Bar {bar.barNumber}
                    </Text>
                    <Text
                      className="font-mono font-bold text-xs mt-0.5"
                      style={{
                        color:
                          bar.accuracyPercent >= 90
                            ? '#10B981'
                            : bar.accuracyPercent >= 70
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    >
                      {bar.accuracyPercent}%
                    </Text>
                    {isWeak && (
                      <View className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Selected Bar Diagnostic Drill-down */}
            {selectedBar && (
              <View className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-row items-center justify-between mt-1">
                <View className="flex flex-col">
                  <Text className="text-white text-xs font-bold">
                    Bar {selectedBar.barNumber} Breakdown: {selectedBar.correctNotes} / {selectedBar.totalNotes} Notes Hit
                  </Text>
                  <Text className="text-slate-400 text-[11px] mt-0.5">
                    {selectedBar.mistakesCount > 0
                      ? `Problematic Notes: ${selectedBar.problematicNotes.join(', ')} (${selectedBar.primaryErrorType || 'slips'})`
                      : 'Flawless rhythmic execution with no missteps.'}
                  </Text>
                </View>

                {selectedBar.accuracyPercent < 80 && (
                  <View className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40">
                    <Text className="text-rose-300 text-[10px] font-bold">Needs Polish</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Gemini AI Coach Analysis Card */}
          <View
            className="p-4 rounded-2xl border flex flex-col gap-2 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.08)',
              borderColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.3)',
            }}
          >
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-1.5">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                <Text
                  className="font-bold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Ru&apos;s Pedagogical Critique
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                <Text className="text-white text-[10px] font-mono">Gemini 3.8 Flash</Text>
              </View>
            </View>

            {isLoadingCoach ? (
              <View className="flex flex-row items-center gap-2 py-2">
                <View className="w-3.5 h-3.5 rounded-full border-2 border-[#FF1E8E] border-t-transparent animate-spin" />
                <Text className="text-slate-400 text-xs italic">
                  Synthesising session telemetry and finger movement advice...
                </Text>
              </View>
            ) : (
              <Text className="text-slate-200 text-xs leading-relaxed">
                {coachAnalysis}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-white/10 shrink-0">
          {hasWeakBars ? (
            <Pressable
              onPress={() => onLoopProblemBars(telemetry.weakBars, 60)}
              className="flex-1 py-3 px-4 rounded-2xl flex flex-row items-center justify-center gap-2 shadow-lg transition-all"
              style={{
                backgroundColor: 'var(--brand-primary, #FF1E8E)',
                boxShadow: 'var(--brand-glow)',
              }}
            >
              <RotateCcw className="w-4 h-4 text-black" />
              <Text className="text-black font-bold text-xs">
                Loop Problem Bars (Slow 60%)
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 px-4 rounded-2xl flex flex-row items-center justify-center gap-2 shadow-lg transition-all"
              style={{
                backgroundColor: 'var(--brand-primary, #FF1E8E)',
                boxShadow: 'var(--brand-glow)',
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <Text className="text-black font-bold text-xs">
                Continue to Next Piece
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={onRestartFullPiece}
            className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-row items-center justify-center gap-2 text-slate-300"
          >
            <Play className="w-4 h-4 text-slate-300" />
            <Text className="text-slate-300 font-semibold text-xs">
              Play Full Piece
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
