import React, { useState } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { Mic, Sliders, Volume2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { PitchDetectionResult, pitchDetector } from '../audio/pitchDetection.ts';

interface MicrophoneCalibrationBarProps {
  isListening: boolean;
  detectedPitch: PitchDetectionResult | null;
  audioLevel: number; // 0 to 1
  onToggleMic: () => void;
  className?: string;
}

export const MicrophoneCalibrationBar: React.FC<MicrophoneCalibrationBarProps> = ({
  isListening,
  detectedPitch,
  audioLevel,
  onToggleMic,
  className = '',
}) => {
  const [showGateControls, setShowGateControls] = useState<boolean>(false);
  const [gateLevel, setGateLevel] = useState<'low' | 'balanced' | 'high'>('balanced');

  const handleSetGate = (level: 'low' | 'balanced' | 'high') => {
    setGateLevel(level);
    if (level === 'low') {
      pitchDetector.setNoiseGateThreshold(0.008);
    } else if (level === 'balanced') {
      pitchDetector.setNoiseGateThreshold(0.016);
    } else {
      pitchDetector.setNoiseGateThreshold(0.035);
    }
  };

  if (!isListening) {
    return null;
  }

  // Audio VU level meter: convert 0-1 to percentage width (capped at 100%)
  const levelPercent = Math.min(100, Math.round(audioLevel * 500));
  const isHearingSound = audioLevel > pitchDetector.getNoiseGateThreshold();

  return (
    <View
      className={`w-full rounded-2xl p-2.5 flex flex-col gap-2 transition-all ${className}`}
      style={{
        backgroundColor: 'var(--surface-elevated, #161021)',
        border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.35)',
        boxShadow: '0 0 16px rgba(var(--brand-primary-rgb, 255, 30, 142), 0.15)',
      }}
    >
      {/* Primary Bar Row: Mic Status + Detected Note + VU Meter + Sensitivity Toggle */}
      <View className="flex flex-row items-center justify-between gap-2">
        {/* Left: Active Live Indicator & Hearing Note */}
        <View className="flex flex-row items-center gap-2 min-w-0">
          <View
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              backgroundColor: isHearingSound ? 'var(--brand-primary)' : 'rgba(var(--brand-primary-rgb), 0.15)',
              boxShadow: isHearingSound ? 'var(--brand-glow)' : 'none',
            }}
          >
            <Mic className="w-3.5 h-3.5" style={{ color: isHearingSound ? '#0B0710' : 'var(--brand-primary)' }} />
          </View>

          <View className="flex flex-col min-w-0">
            <View className="flex flex-row items-center gap-1.5">
              <Text className="text-white font-bold text-xs font-heading tracking-tight truncate">
                {detectedPitch && detectedPitch.confidence >= 0.65 ? (
                  <>
                    Hearing:{' '}
                    <Text className="font-mono font-black" style={{ color: 'var(--brand-primary)' }}>
                      {detectedPitch.note}
                    </Text>
                  </>
                ) : (
                  'Listening to Piano...'
                )}
              </Text>

              {/* Pitch Deviation Needle / Cent Offset */}
              {detectedPitch && detectedPitch.confidence >= 0.65 && (
                <View
                  className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold flex flex-row items-center gap-0.5"
                  style={{
                    backgroundColor: Math.abs(detectedPitch.centsOff) <= 10 ? '#10B98130' : '#F59E0B30',
                    color: Math.abs(detectedPitch.centsOff) <= 10 ? '#10B981' : '#F59E0B',
                    border: `1px solid ${Math.abs(detectedPitch.centsOff) <= 10 ? '#10B98150' : '#F59E0B50'}`,
                  }}
                >
                  <Text
                    className="text-[9px] font-mono font-bold"
                    style={{ color: Math.abs(detectedPitch.centsOff) <= 10 ? '#10B981' : '#F59E0B' }}
                  >
                    {detectedPitch.centsOff > 0 ? `+${detectedPitch.centsOff}¢` : `${detectedPitch.centsOff}¢`}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-[10px] text-slate-400 truncate">
              {detectedPitch && detectedPitch.confidence >= 0.65
                ? `${detectedPitch.frequency} Hz · ${Math.round(detectedPitch.confidence * 100)}% Confidence`
                : 'Play any acoustic or digital piano key'}
            </Text>
          </View>
        </View>

        {/* Right: Real-time Audio Level Bar & Settings Trigger */}
        <View className="flex flex-row items-center gap-2 shrink-0">
          {/* Live Audio Level VU Meter */}
          <View className="flex flex-col gap-0.5 items-end">
            <Text className="text-[9px] text-slate-400 font-mono">Audio Input</Text>
            <View className="w-20 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative">
              <View
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${levelPercent}%`,
                  backgroundColor:
                    levelPercent > 80 ? '#EF4444' : levelPercent > 50 ? '#F59E0B' : 'var(--brand-primary)',
                  boxShadow: levelPercent > 10 ? 'var(--brand-glow)' : 'none',
                }}
              />
            </View>
          </View>

          {/* Noise Gate Calibration Toggle */}
          <Pressable
            onPress={() => setShowGateControls((prev) => !prev)}
            className="p-1.5 rounded-xl border transition-all"
            style={{
              backgroundColor: showGateControls ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: showGateControls ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.1)',
            }}
            accessibilityLabel="Calibrate Microphone Sensitivity and Noise Gate"
          >
            <Sliders className="w-3.5 h-3.5" style={{ color: showGateControls ? 'var(--brand-primary)' : '#94A3B8' }} />
          </Pressable>

          {/* Quick Mic Stop */}
          <Pressable
            onPress={onToggleMic}
            className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            accessibilityLabel="Disable Microphone Input"
          >
            <Text className="text-[10px] font-bold text-slate-300">Turn Off</Text>
          </Pressable>
        </View>
      </View>

      {/* Expandable Sensitivity / Noise Gate Calibration Drawer */}
      {showGateControls && (
        <View className="pt-2 border-t border-white/10 flex flex-col gap-1.5 animate-fade-in">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-[11px] font-bold text-slate-300">
              Microphone Sensitivity / Noise Gate Floor:
            </Text>
            <Text className="text-[10px] text-slate-400">
              Filter out background speech &amp; room echoes
            </Text>
          </View>

          <View className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'low', label: 'Sensitive', desc: 'Quiet room / soft playing' },
              { id: 'balanced', label: 'Balanced', desc: 'Recommended for home pianos' },
              { id: 'high', label: 'High Gate', desc: 'Noisy room / television' },
            ].map((preset) => {
              const isSelected = gateLevel === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSetGate(preset.id as any)}
                  className="p-2 rounded-xl border flex flex-col items-center text-center transition-all"
                  style={{
                    backgroundColor: isSelected ? 'rgba(var(--brand-primary-rgb), 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isSelected ? 'var(--brand-primary)' : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <View className="flex flex-row items-center gap-1">
                    {isSelected && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                    <Text
                      className="text-xs font-bold"
                      style={{ color: isSelected ? 'var(--brand-primary)' : '#F1F5F9' }}
                    >
                      {preset.label}
                    </Text>
                  </View>
                  <Text className="text-[9px] text-slate-400 line-clamp-1">{preset.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
