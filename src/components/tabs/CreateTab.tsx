import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from '../native-ui.tsx';
import { TrackGenre, DrumStepGrid, ChordPadItem, SavedProject } from '../../types/index.ts';
import { audioEngine } from '../../audio/audioEngine.ts';
import { Play, Pause, RotateCcw, Sparkles, Sliders, Volume2, Music, Disc3, FastForward, Save, CheckCircle2 } from 'lucide-react';

interface CreateTabProps {
  onEarnXp: (xp: number) => void;
  onSaveProject?: (project: SavedProject) => void;
  savedProjects?: SavedProject[];
}

const GENRE_PRESETS: Record<TrackGenre, { bpm: number; kick: number[]; snare: number[]; clap: number[]; hihat: number[] }> = {
  'lo-fi': {
    bpm: 82,
    kick: [0, 6, 10],
    snare: [4, 12],
    clap: [],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  'hip-hop': {
    bpm: 90,
    kick: [0, 8, 10],
    snare: [4, 12],
    clap: [12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  'trap': {
    bpm: 140,
    kick: [0, 7, 10],
    snare: [8],
    clap: [4, 12],
    hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  'house': {
    bpm: 124,
    kick: [0, 4, 8, 12],
    snare: [],
    clap: [4, 12],
    hihat: [2, 6, 10, 14],
  },
  'afrobeats': {
    bpm: 104,
    kick: [0, 6, 10],
    snare: [4, 12],
    clap: [12],
    hihat: [0, 3, 6, 9, 12],
  },
  'r&b': {
    bpm: 88,
    kick: [0, 8, 11],
    snare: [4, 12],
    clap: [],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  'pop': {
    bpm: 118,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    clap: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
};

const CHORD_PADS: ChordPadItem[] = [
  { name: 'Cmaj7', notes: ['C4', 'E4', 'G4', 'B4'], category: 'Major' },
  { name: 'Am7', notes: ['A3', 'C4', 'E4', 'G4'], category: 'Minor' },
  { name: 'Dm7', notes: ['D4', 'F4', 'A4', 'C5'], category: 'Minor' },
  { name: 'G7', notes: ['G3', 'B3', 'D4', 'F4'], category: '7th' },
  { name: 'Fmaj7', notes: ['F3', 'A3', 'C4', 'E4'], category: 'Major' },
  { name: 'Em7', notes: ['E3', 'G3', 'B3', 'D4'], category: 'Minor' },
];

export const CreateTab: React.FC<CreateTabProps> = ({ onEarnXp, onSaveProject, savedProjects = [] }) => {
  const [studioMode, setStudioMode] = useState<'simple' | 'pro'>('simple');
  const [genre, setGenre] = useState<TrackGenre>('lo-fi');
  const [bpm, setBpm] = useState<number>(82);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [projectTitle, setProjectTitle] = useState<string>('My Studio Beat');
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  // 16-step grid
  const [grid, setGrid] = useState<DrumStepGrid>({
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    clap: new Array(16).fill(false),
    hihatClosed: new Array(16).fill(false),
    hihatOpen: new Array(16).fill(false),
    perc: new Array(16).fill(false),
  });

  // Bass line sequence (16 steps)
  const [bassSteps, setBassSteps] = useState<Record<number, string>>({
    0: 'C2',
    6: 'A1',
    10: 'F1',
    14: 'G1',
  });

  const handleSaveCurrentBeat = () => {
    if (onSaveProject) {
      const newProj: SavedProject = {
        id: 'proj-' + Date.now(),
        title: projectTitle.trim() || 'My Studio Beat',
        genre,
        bpm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gridData: grid,
        bassSteps,
      };
      onSaveProject(newProj);
      onEarnXp(25);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    }
  };

  // Load genre preset
  const loadPreset = (selectedGenre: TrackGenre) => {
    setGenre(selectedGenre);
    const p = GENRE_PRESETS[selectedGenre];
    setBpm(p.bpm);

    const newGrid: DrumStepGrid = {
      kick: new Array(16).fill(false),
      snare: new Array(16).fill(false),
      clap: new Array(16).fill(false),
      hihatClosed: new Array(16).fill(false),
      hihatOpen: new Array(16).fill(false),
      perc: new Array(16).fill(false),
    };

    p.kick.forEach((s) => (newGrid.kick[s] = true));
    p.snare.forEach((s) => (newGrid.snare[s] = true));
    p.clap.forEach((s) => (newGrid.clap[s] = true));
    p.hihat.forEach((s) => (newGrid.hihatClosed[s] = true));

    setGrid(newGrid);
  };

  // Initialise with default preset
  useEffect(() => {
    loadPreset('lo-fi');
  }, []);

  // Sequencer playback loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      const stepIntervalMs = (60 / bpm / 4) * 1000;
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;

          // Trigger sounds on this step
          if (grid.kick[next]) audioEngine.playDrum('kick');
          if (grid.snare[next]) audioEngine.playDrum('snare');
          if (grid.clap[next]) audioEngine.playDrum('clap');
          if (grid.hihatClosed[next]) audioEngine.playDrum('hihatClosed');
          if (grid.hihatOpen[next]) audioEngine.playDrum('hihatOpen');
          if (grid.perc[next]) audioEngine.playDrum('perc');

          // Bass note trigger
          if (bassSteps[next]) {
            audioEngine.playBassNote(bassSteps[next], '8n');
          }

          return next;
        });
      }, stepIntervalMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, bpm, grid, bassSteps]);

  const toggleGridCell = (instrument: keyof DrumStepGrid, stepIdx: number) => {
    audioEngine.ensureAudioContext();
    setGrid((prev) => {
      const row = [...prev[instrument]];
      row[stepIdx] = !row[stepIdx];
      if (row[stepIdx]) {
        audioEngine.playDrum(instrument);
      }
      return { ...prev, [instrument]: row };
    });
  };

  const playChordPad = (pad: ChordPadItem) => {
    audioEngine.ensureAudioContext();
    pad.notes.forEach((n, idx) => {
      setTimeout(() => {
        audioEngine.playPianoNote(n, '2n', 0.85);
      }, idx * 45);
    });
    onEarnXp(5);
  };

  const triggerFingerDrum = (type: keyof DrumStepGrid) => {
    audioEngine.ensureAudioContext();
    audioEngine.playDrum(type);
  };

  return (
    <ScrollView className="w-full flex-1 p-4 pb-24 gap-5">
      {/* Studio Header: Simple/Pro Mode, Genre Presets, Tempo, Transport */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center justify-between flex-wrap gap-2">
          <View className="flex flex-row items-center gap-2">
            <Disc3 className="w-5 h-5 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm font-heading">Creative Studio &amp; Beat Maker</Text>
          </View>

          {/* Simple vs Pro mode toggle */}
          <View className="flex flex-row items-center gap-1 p-1 bg-[#0B0710] rounded-xl border border-white/10">
            <Pressable
              onPress={() => setStudioMode('simple')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                studioMode === 'simple'
                  ? 'bg-[#FF1E8E] text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <Text className="text-xs text-white">Simple Mode</Text>
            </Pressable>
            <Pressable
              onPress={() => setStudioMode('pro')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                studioMode === 'pro'
                  ? 'bg-[#FF1E8E] text-white shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              <Text className="text-xs text-white">Pro Studio</Text>
            </Pressable>
          </View>
        </View>

        {/* Transport controls: Play, Pause, BPM, Genre */}
        <View className="flex flex-row items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-3">
          <View className="flex flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                audioEngine.ensureAudioContext();
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs flex flex-row items-center gap-1.5 transition-all"
              style={{
                backgroundColor: 'var(--brand-primary)',
                boxShadow: 'var(--brand-glow)',
              }}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-black" />
                  <Text className="text-black font-bold text-xs font-heading">Stop</Text>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-black" />
                  <Text className="text-black font-bold text-xs font-heading">Play Beat</Text>
                </>
              )}
            </Pressable>

            <View className="flex flex-row items-center gap-1.5 px-3 py-1.5 bg-[#0B0710] border border-white/10 rounded-xl">
              <Text className="text-xs text-slate-400 font-medium">BPM:</Text>
              <Text
                className="text-xs font-bold font-mono tabular-nums transition-colors"
                style={{ color: 'var(--brand-primary)' }}
              >
                {bpm}
              </Text>
            </View>

            {/* Save Beat to Profile */}
            <Pressable
              onPress={handleSaveCurrentBeat}
              className={`px-3 py-2 rounded-xl border flex flex-row items-center gap-1.5 text-xs font-bold transition-all ${
                isSavedRecently
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
              }`}
              accessibilityLabel="Save beat project to active profile"
            >
              {isSavedRecently ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Save className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <Text className="text-xs font-bold text-white">
                {isSavedRecently ? 'Beat Saved!' : 'Save Beat'}
              </Text>
            </Pressable>
          </View>

          {/* Genre selector */}
          <View className="flex flex-row items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {(['lo-fi', 'hip-hop', 'trap', 'house', 'afrobeats', 'r&b', 'pop'] as TrackGenre[]).map((g) => (
              <Pressable
                key={g}
                onPress={() => loadPreset(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize border ${
                  genre === g
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Text className="text-xs capitalize text-white">{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* 16-Step Sequencer Grid */}
      <View
        className="rounded-3xl p-4 shadow-xl flex flex-col gap-3 transition-all"
        style={{
          backgroundColor: 'var(--surface-elevated, #161021)',
          border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.25)',
        }}
      >
        <View className="flex flex-row items-center justify-between">
          <Text className="text-white font-bold text-sm font-heading">16-Step Beat Grid</Text>
          <Text className="text-xs text-slate-400 font-mono tabular-nums">Step {currentStep + 1} of 16</Text>
        </View>

        <View className="overflow-x-auto hide-scrollbar w-full">
          <View className="min-w-[480px] flex flex-col gap-1.5">
            {/* Step header indicators */}
            <View className="flex flex-row pl-20 pr-1">
              {Array.from({ length: 16 }).map((_, stepIdx) => (
                <View
                  key={stepIdx}
                  className={`flex-1 h-1.5 rounded-full mx-0.5 transition-all ${
                    currentStep === stepIdx
                      ? ''
                      : stepIdx % 4 === 0
                      ? 'bg-slate-600'
                      : 'bg-white/10'
                  }`}
                  style={
                    currentStep === stepIdx
                      ? {
                          backgroundColor: 'var(--brand-primary)',
                          boxShadow: 'var(--brand-glow)',
                        }
                      : {}
                  }
                />
              ))}
            </View>

            {/* Instrument rows: Kick, Snare, Clap, Hi-hat */}
            {(['kick', 'snare', 'clap', 'hihatClosed', 'hihatOpen', 'perc'] as (keyof DrumStepGrid)[]).map(
              (inst) => (
                <View key={inst} className="flex flex-row items-center">
                  {/* Row Label */}
                  <Pressable
                    onPress={() => triggerFingerDrum(inst)}
                    className="w-20 text-left pr-2 py-1"
                  >
                    <Text className="text-xs font-bold text-slate-300 capitalize">
                      {inst === 'hihatClosed' ? 'Hat (Cl)' : inst === 'hihatOpen' ? 'Hat (Op)' : inst}
                    </Text>
                  </Pressable>

                  {/* 16 Step Buttons */}
                  <View className="flex-1 flex flex-row">
                    {grid[inst].map((isActive, sIdx) => {
                      const isCurrentPlaying = currentStep === sIdx && isPlaying;
                      return (
                        <Pressable
                          key={sIdx}
                          onPress={() => toggleGridCell(inst, sIdx)}
                          className={`flex-1 h-9 mx-0.5 rounded-lg border transition-all flex items-center justify-center ${
                            isActive
                              ? inst === 'kick'
                                ? 'text-black'
                                : inst === 'snare' || inst === 'clap'
                                ? 'text-white'
                                : 'bg-emerald-500 border-emerald-400 shadow-sm'
                              : sIdx % 4 === 0
                              ? 'bg-[#23112B]/80 border-white/10 hover:bg-[#23112B]'
                              : 'bg-[#0B0710] border-white/5 hover:bg-[#161021]'
                          } ${isCurrentPlaying ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                          style={
                            isActive
                              ? inst === 'kick'
                                ? {
                                    backgroundColor: 'var(--brand-primary)',
                                    borderColor: 'var(--brand-primary)',
                                    boxShadow: 'var(--brand-glow)',
                                  }
                                : inst === 'snare' || inst === 'clap'
                                ? {
                                    backgroundColor: 'var(--brand-secondary)',
                                    borderColor: 'var(--brand-secondary)',
                                    boxShadow: '0 0 8px var(--brand-secondary)',
                                  }
                                : {}
                              : {}
                          }
                          accessibilityLabel={`${inst} step ${sIdx + 1}`}
                        />
                      );
                    })}
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      </View>

      {/* Chord Pads (Curriculum Integrated) - Dynamic Secondary Accent */}
      <View
        className="rounded-3xl p-4 shadow-xl flex flex-col gap-3 transition-all"
        style={{
          backgroundColor: 'var(--surface-elevated, #161021)',
          border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.2)',
        }}
      >
        <View className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <View className="flex flex-row items-center gap-2">
            <Music className="w-4 h-4 shrink-0 transition-colors" style={{ color: 'var(--brand-secondary)' }} />
            <Text className="text-white font-bold text-sm font-heading">
              Chord Pads (From Completed Lessons)
            </Text>
          </View>
          <Text className="text-xs text-slate-400">Tap to audition and record with tactile feedback</Text>
        </View>

        <View className="grid grid-cols-3 gap-2.5">
          {CHORD_PADS.map((pad) => (
            <Pressable
              key={pad.name}
              onPress={() => playChordPad(pad)}
              className="p-4 rounded-2xl active:scale-95 flex flex-col items-center justify-center gap-1 shadow-md transition-all"
              style={{
                backgroundColor: 'rgba(var(--brand-secondary-rgb, 184, 41, 255), 0.15)',
                border: '1px solid rgba(var(--brand-secondary-rgb, 184, 41, 255), 0.4)',
                boxShadow: '0 0 10px rgba(var(--brand-secondary-rgb, 184, 41, 255), 0.15)',
              }}
              accessibilityLabel={`Play chord ${pad.name}`}
            >
              <Text className="text-white font-bold text-base tracking-tight font-heading">{pad.name}</Text>
              <Text className="text-[10px] text-[#B829FF] font-mono tabular-nums font-semibold">
                {pad.notes.join(' - ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bass Line Synthesizer (Sub / 808) */}
      <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
        <View className="flex flex-row items-center justify-between">
          <Text className="text-white font-bold text-sm font-heading">Sub / 808 Bass Line</Text>
          <View className="px-2.5 py-0.5 rounded-full bg-[#B829FF]/15 border border-[#B829FF]/30">
            <Text className="text-[#B829FF] text-xs font-semibold">Scale Locked (C Major)</Text>
          </View>
        </View>

        <View className="grid grid-cols-4 gap-2">
          {['C1', 'E1', 'F1', 'G1'].map((bassNote) => (
            <Pressable
              key={bassNote}
              onPress={() => {
                audioEngine.ensureAudioContext();
                audioEngine.playBassNote(bassNote, '4n');
              }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
              accessibilityLabel={`Trigger Bass ${bassNote}`}
            >
              <Text className="text-white font-bold text-sm font-mono">{bassNote}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
