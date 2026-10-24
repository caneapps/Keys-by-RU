/**
 * Audio Calibration & Anti-Bleed Drawer for Keys by Ru.
 * Displays:
 * - Real-time 24-band frequency spectrum and volume VU meter
 * - Active detected note & polyphonic chord pills (e.g. C4 + E4 + G4 (C Major))
 * - 2-Second Ambient Noise Calibration routine
 * - Speaker Bleed Protection toggle (mutes internal synth to prevent microphone acoustic loopback)
 * - Web MIDI / Bluetooth MIDI device connection status
 *
 * Built strictly with React Native primitives (View, Text, Pressable). ZERO HTML tags.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import {
  audioInputEngine,
  SpectralAnalysisResult,
  MidiDeviceState,
} from '../services/audioInputEngine.ts';
import {
  Mic,
  Sliders,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Radio,
  Cable,
  Check,
  ChevronUp,
  X,
} from 'lucide-react';

interface AudioCalibrationDrawerProps {
  analysis: SpectralAnalysisResult | null;
  isListening: boolean;
  onClose: () => void;
  onToggleMic: () => void;
}

export const AudioCalibrationDrawer: React.FC<AudioCalibrationDrawerProps> = ({
  analysis,
  isListening,
  onClose,
  onToggleMic,
}) => {
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibratedFloor, setCalibratedFloor] = useState<number | null>(null);
  const [bleedProtection, setBleedProtection] = useState<boolean>(true);
  const [gatePreset, setGatePreset] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [midiState, setMidiState] = useState<MidiDeviceState>(() => audioInputEngine.getMidiState());

  useEffect(() => {
    // Check initial bleed protection
    setBleedProtection(audioInputEngine.getSpeakerBleedProtection());

    // Listen for MIDI hardware connect / disconnect events
    audioInputEngine.initMidi((state) => {
      setMidiState(state);
    });
  }, []);

  const handleRunCalibration = async () => {
    setIsCalibrating(true);
    const measured = await audioInputEngine.calibrateRoomNoise(2000);
    setCalibratedFloor(measured);
    setIsCalibrating(false);
  };

  const handleToggleBleedProtection = () => {
    const nextVal = !bleedProtection;
    setBleedProtection(nextVal);
    audioInputEngine.setSpeakerBleedProtection(nextVal);
  };

  const handleSetGatePreset = (preset: 'low' | 'balanced' | 'high') => {
    setGatePreset(preset);
    if (preset === 'low') {
      audioInputEngine.setNoiseGateFloor(0.008);
    } else if (preset === 'balanced') {
      audioInputEngine.setNoiseGateFloor(0.016);
    } else {
      audioInputEngine.setNoiseGateFloor(0.035);
    }
  };

  const audioLevelPercent = analysis ? Math.min(100, Math.round(analysis.audioLevel * 500)) : 0;
  const spectrumBars = analysis?.spectrumBars || new Array(24).fill(0.08);

  return (
    <View
      className="w-full bg-[#161021]/95 border-b border-[#FF1E8E]/30 p-4 shadow-2xl flex flex-col gap-4 animate-fade-in"
      style={{
        borderBottomColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.35)',
        boxShadow: 'var(--brand-glow)',
      }}
    >
      {/* Header with Title and Close Button */}
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.15)',
              border: '1px solid var(--brand-primary)',
            }}
          >
            <Sliders className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          </View>
          <View className="flex flex-col">
            <Text className="text-white font-bold text-sm font-heading">
              Audio Input & Recognition Calibration
            </Text>
            <Text className="text-slate-400 text-[11px]">
              Acoustic iPhone Mic & Digital Piano Bluetooth/USB MIDI
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
          accessibilityLabel="Close Calibration Drawer"
        >
          <ChevronUp className="w-4 h-4 text-slate-300" />
        </Pressable>
      </View>

      {/* Live Frequency Spectrum & VU Level Monitor */}
      <View className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2.5">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}
            />
            <Text className="text-slate-300 text-xs font-semibold">
              Live Spectrum & Sound Pressure
            </Text>
          </View>

          {/* Active Detected Note / Chord Pill */}
          {analysis && analysis.detectedNote ? (
            <View className="flex flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <Text className="text-emerald-300 font-mono font-bold text-xs">
                {analysis.detectedChordName
                  ? `${analysis.detectedChordName} (${analysis.activeChordNotes.join(' + ')})`
                  : `Hearing: ${analysis.detectedNote} (${analysis.centsOffset >= 0 ? `+${analysis.centsOffset}` : analysis.centsOffset}¢)`}
              </Text>
            </View>
          ) : (
            <Text className="text-slate-500 text-[11px] font-mono">
              {isListening ? 'Waiting for piano note...' : 'Microphone inactive'}
            </Text>
          )}
        </View>

        {/* 24-Band Visual Spectrum Equalizer */}
        <View className="h-10 w-full flex flex-row items-end justify-between gap-1 px-1 py-1 bg-black/60 rounded-xl border border-white/5 overflow-hidden">
          {spectrumBars.map((mag, idx) => {
            const heightPercent = Math.max(8, Math.min(100, Math.round(mag * 100)));
            return (
              <View
                key={idx}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor:
                    heightPercent > 80
                      ? '#FF1E8E'
                      : heightPercent > 50
                      ? 'var(--brand-primary, #FF1E8E)'
                      : '#3B82F6',
                  opacity: isListening ? 0.9 : 0.25,
                }}
              />
            );
          })}
        </View>

        {/* VU Level Meter Bar */}
        <View className="flex flex-row items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <View className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden relative border border-white/5">
            <View
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${audioLevelPercent}%`,
                backgroundColor:
                  audioLevelPercent > 85 ? '#EF4444' : audioLevelPercent > 40 ? '#10B981' : '#3B82F6',
              }}
            />
          </View>
          <Text className="text-slate-400 font-mono text-[10px] w-9 text-right">
            {audioLevelPercent}%
          </Text>
        </View>
      </View>

      {/* Row: Calibration & Speaker Bleed & Web MIDI */}
      <View className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* 1. Ambient Room Noise Calibration */}
        <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
          <View className="flex flex-col gap-1">
            <Text className="text-white font-bold text-xs">Room Noise Floor</Text>
            <Text className="text-slate-400 text-[11px] leading-tight">
              Calibrates the noise gate to your room&apos;s natural acoustics.
            </Text>
          </View>

          <Pressable
            onPress={handleRunCalibration}
            disabled={isCalibrating || !isListening}
            className={`py-2 px-3 rounded-xl flex flex-row items-center justify-center gap-1.5 transition-all ${
              isCalibrating
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <Text className="text-white font-semibold text-xs">
              {isCalibrating
                ? 'Listening (2s)...'
                : calibratedFloor
                ? `Calibrated: ${(calibratedFloor * 100).toFixed(1)}%`
                : 'Measure Room Noise'}
            </Text>
          </Pressable>
        </View>

        {/* 2. Speaker Bleed Protection */}
        <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
          <View className="flex flex-col gap-1">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white font-bold text-xs">Speaker Bleed Guard</Text>
              <View
                className={`w-2 h-2 rounded-full ${
                  bleedProtection ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
            </View>
            <Text className="text-slate-400 text-[11px] leading-tight">
              Ducks synth sound so the iPhone doesn&apos;t hear its own speaker.
            </Text>
          </View>

          <Pressable
            onPress={handleToggleBleedProtection}
            className={`py-2 px-3 rounded-xl flex flex-row items-center justify-center gap-1.5 transition-all ${
              bleedProtection
                ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                : 'bg-white/5 border border-white/10 text-slate-400'
            }`}
          >
            {bleedProtection ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <Text
              className={`font-semibold text-xs ${
                bleedProtection ? 'text-emerald-300' : 'text-slate-400'
              }`}
            >
              {bleedProtection ? 'Anti-Bleed: Active' : 'Anti-Bleed: Off'}
            </Text>
          </Pressable>
        </View>

        {/* 3. Web MIDI / Digital Piano Status */}
        <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
          <View className="flex flex-col gap-1">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white font-bold text-xs">Digital Piano MIDI</Text>
              <View
                className={`w-2 h-2 rounded-full ${
                  midiState.isConnected ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
            </View>
            <Text className="text-slate-400 text-[11px] leading-tight">
              {midiState.deviceName || 'USB or Bluetooth MIDI keyboard'}
            </Text>
          </View>

          <Pressable
            onPress={() => audioInputEngine.initMidi((s) => setMidiState(s))}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex flex-row items-center justify-center gap-1.5"
          >
            <Cable className="w-3.5 h-3.5 text-[#FF1E8E]" />
            <Text className="text-white font-semibold text-xs">
              {midiState.isConnected ? 'MIDI Connected' : 'Connect MIDI Piano'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
