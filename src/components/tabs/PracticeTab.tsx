import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from '../native-ui.tsx';
import { StaffSheetMusic } from '../StaffSheetMusic.tsx';
import { FallingNotesView } from '../FallingNotesView.tsx';
import { PianoKeyboard } from '../PianoKeyboard.tsx';
import { PUBLIC_DOMAIN_SONGS } from '../../data/curriculum.ts';
import { Song, PracticeNote, HandType, UserProfile } from '../../types/index.ts';
import { audioEngine } from '../../audio/audioEngine.ts';
import { metronome } from '../../audio/metronome.ts';
import { pitchDetector, PitchDetectionResult } from '../../audio/pitchDetection.ts';
import { calculateStars, calculateXpReward, getScaleNotes, getChordNotes } from '../../utils/musicLogic.ts';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Mic,
  Sliders,
  Sparkles,
  Award,
  Layers,
  Compass,
  Headphones,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PracticeTabProps {
  userProfile: UserProfile;
  initialSong?: Song | null;
  onMicRequest: () => void;
  onEarnXp: (xp: number) => void;
}

export const PracticeTab: React.FC<PracticeTabProps> = ({
  userProfile,
  initialSong,
  onMicRequest,
  onEarnXp,
}) => {
  const [selectedSong, setSelectedSong] = useState<Song>(initialSong || PUBLIC_DOMAIN_SONGS[0]);
  const [practiceMode, setPracticeMode] = useState<'wait' | 'tempo'>('wait');
  const [handFocus, setHandFocus] = useState<HandType>('right');
  const [tempoSpeedPercent, setTempoSpeedPercent] = useState<number>(100);
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);

  // Playback & Interactive note tracking
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);

  // Microphone pitch detection state
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);

  // Sub-views: 'song_practice' | 'ear_training' | 'theory_tools'
  const [activeSubView, setActiveSubView] = useState<'song_practice' | 'ear_training' | 'theory_tools'>('song_practice');

  // Ear training game state
  const [earQuestionType, setEarQuestionType] = useState<'major_minor' | 'interval'>('major_minor');
  const [earTargetChord, setEarTargetChord] = useState<{ name: string; type: 'Major' | 'Minor'; notes: string[] }>({
    name: 'C Major',
    type: 'Major',
    notes: ['C4', 'E4', 'G4'],
  });
  const [earScore, setEarScore] = useState<number>(0);
  const [earFeedback, setEarFeedback] = useState<string | null>(null);

  // Theory Tool state
  const [selectedRoot, setSelectedRoot] = useState<string>('C');
  const [selectedScaleType, setSelectedScaleType] = useState<'major' | 'minor' | 'pentatonic'>('major');
  const [activeTheoryNotes, setActiveTheoryNotes] = useState<string[]>(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);

  // Collapsible settings drawer for clean practice view
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Update metronome tempo when song or speed changes
  useEffect(() => {
    const effectiveBpm = Math.round(selectedSong.bpm * (tempoSpeedPercent / 100));
    metronome.setBpm(effectiveBpm);
  }, [selectedSong, tempoSpeedPercent]);

  // Metronome toggle
  const toggleMetronome = () => {
    if (isMetronomeActive) {
      metronome.stop();
      setIsMetronomeActive(false);
    } else {
      audioEngine.ensureAudioContext();
      metronome.start((beat) => {
        setCurrentBeat(beat);
      });
      setIsMetronomeActive(true);
    }
  };

  // Toggle Microphone Pitch Detection
  const toggleMicListening = async () => {
    if (isMicActive) {
      pitchDetector.stopListening();
      setIsMicActive(false);
      setDetectedPitch(null);
    } else {
      onMicRequest();
      const started = await pitchDetector.startListening((res) => {
        setDetectedPitch(res);
        if (res && res.confidence > 0.75) {
          handleNoteInput(res.note);
        }
      });
      if (started) {
        setIsMicActive(true);
      }
    }
  };

  // Reset practice piece
  const resetPractice = () => {
    setCurrentNoteIndex(0);
    setIsPlaying(false);
    setCorrectHits(0);
    setTotalAttempts(0);
    setAccuracy(100);
    setLastFeedback(null);
  };

  // Note hit handler (from on-screen keyboard, mic, or MIDI)
  const handleNoteInput = (note: string) => {
    audioEngine.playPianoNote(note, '8n');

    const target = selectedSong.notes[currentNoteIndex]?.note;
    if (!target) return;

    setTotalAttempts((prev) => prev + 1);

    if (note === target) {
      setLastFeedback('perfect');
      setCorrectHits((prev) => prev + 1);
      const nextIdx = currentNoteIndex + 1;

      // Update accuracy
      const newAcc = Math.round(((correctHits + 1) / (totalAttempts + 1)) * 100);
      setAccuracy(newAcc);

      if (nextIdx >= selectedSong.notes.length) {
        // Song finished!
        setIsPlaying(false);
        const stars = calculateStars(newAcc);
        const xp = calculateXpReward(50, newAcc, userProfile.currentStreak);
        onEarnXp(xp);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        setCurrentNoteIndex(nextIdx);
      }
    } else {
      setLastFeedback('miss');
      const newAcc = Math.round((correctHits / (totalAttempts + 1)) * 100);
      setAccuracy(newAcc);
    }
  };

  // Ear training chord play
  const playEarChord = () => {
    audioEngine.ensureAudioContext();
    earTargetChord.notes.forEach((n, idx) => {
      setTimeout(() => {
        audioEngine.playPianoNote(n, '2n');
      }, idx * 140);
    });
  };

  const checkEarAnswer = (userChoice: 'Major' | 'Minor') => {
    if (userChoice === earTargetChord.type) {
      setEarScore((s) => s + 1);
      setEarFeedback('Spot on! That was indeed a ' + earTargetChord.type + ' triad. (+20 XP)');
      onEarnXp(20);
      // Generate new chord
      const roots = ['C', 'D', 'E', 'F', 'G', 'A'];
      const randomRoot = roots[Math.floor(Math.random() * roots.length)];
      const randomType: 'Major' | 'Minor' = Math.random() > 0.5 ? 'Major' : 'Minor';
      const newNotes = getChordNotes(randomRoot, randomType === 'Major' ? 'major' : 'minor');
      setEarTargetChord({
        name: `${randomRoot} ${randomType}`,
        type: randomType,
        notes: newNotes,
      });
    } else {
      setEarFeedback('Not quite—listen closely to the 3rd scale degree.');
    }
  };

  // Scale / Chord finder selection
  const updateScaleFinder = (root: string, type: 'major' | 'minor' | 'pentatonic') => {
    setSelectedRoot(root);
    setSelectedScaleType(type);
    const notes = getScaleNotes(root, type);
    setActiveTheoryNotes(notes);
  };

  const playScaleNotes = async () => {
    audioEngine.ensureAudioContext();
    for (const n of activeTheoryNotes) {
      audioEngine.playPianoNote(n, '8n');
      await new Promise((r) => setTimeout(r, 260));
    }
  };

  const currentTargetNote = selectedSong.notes[currentNoteIndex]?.note;
  const currentFinger = selectedSong.notes[currentNoteIndex]?.finger || 1;

  return (
    <View className="w-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
      {/* Sub-navigation bar: Song Practice | Ear Training | Theory Tools */}
      <View
        className="w-full bg-[#0B0710] border-b px-3 py-1.5 flex flex-row items-center justify-between shrink-0"
        style={{ borderBottomColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.2)' }}
      >
        <View className="flex flex-row items-center gap-1 p-0.5 bg-[#161021] rounded-xl border border-white/10">
          <Pressable
            onPress={() => setActiveSubView('song_practice')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={
              activeSubView === 'song_practice'
                ? { backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--brand-glow)' }
                : {}
            }
          >
            <Text
              className="font-semibold text-xs transition-colors"
              style={{ color: activeSubView === 'song_practice' ? '#000000' : '#94A3B8' }}
            >
              Practice Song
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSubView('ear_training')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={
              activeSubView === 'ear_training'
                ? { backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--brand-glow)' }
                : {}
            }
          >
            <Text
              className="font-semibold text-xs transition-colors"
              style={{ color: activeSubView === 'ear_training' ? '#000000' : '#94A3B8' }}
            >
              Ear Training
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSubView('theory_tools')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={
              activeSubView === 'theory_tools'
                ? { backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--brand-glow)' }
                : {}
            }
          >
            <Text
              className="font-semibold text-xs transition-colors"
              style={{ color: activeSubView === 'theory_tools' ? '#000000' : '#94A3B8' }}
            >
              Scale Tool
            </Text>
          </Pressable>
        </View>

        {/* Microphone Pitch Detection Toggle */}
        <Pressable
          onPress={toggleMicListening}
          className={`flex flex-row items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold ${
            isMicActive
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          accessibilityLabel="Toggle Microphone Pitch Detection"
        >
          <Mic className="w-3 h-3" />
          <Text className="font-bold text-[11px] text-white">
            {isMicActive ? (detectedPitch?.note ? `${detectedPitch.note}` : 'Listening') : 'Mic'}
          </Text>
        </Pressable>
      </View>

      {/* Main Viewport */}
      {activeSubView === 'song_practice' && (
        <ScrollView className="flex-1 min-h-0 w-full max-w-4xl mx-auto p-2.5 flex flex-col gap-2.5">
          {/* Compact Practice Header Strip & Collapsible Settings Drawer */}
          <View
            className="rounded-2xl p-2.5 border flex flex-col gap-2 shrink-0 transition-all"
            style={{
              backgroundColor: 'var(--surface-elevated, #161021)',
              borderColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.25)',
            }}
          >
            <View className="flex flex-row items-center justify-between gap-2">
              {/* Active Song Badge & Details */}
              <View className="flex flex-row items-center gap-2 min-w-0">
                <View
                  className="px-2 py-0.5 rounded-lg shrink-0 transition-all"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    boxShadow: 'var(--brand-glow)',
                  }}
                >
                  <Text className="text-black font-bold text-xs truncate font-heading">
                    {selectedSong.title}
                  </Text>
                </View>
                <Text className="text-slate-400 text-xs truncate">
                  {selectedSong.bpm} BPM · {practiceMode === 'wait' ? 'Wait' : 'Tempo'}
                </Text>
              </View>

              {/* Action Buttons: Toggle Drawer & Restart */}
              <View className="flex flex-row items-center gap-1.5 shrink-0">
                <Pressable
                  onPress={() => setShowSettingsDrawer(!showSettingsDrawer)}
                  className="px-2 py-1 rounded-lg border text-xs font-semibold flex flex-row items-center gap-1 transition-all"
                  style={
                    showSettingsDrawer
                      ? {
                          backgroundColor: 'var(--brand-primary)',
                          borderColor: 'var(--brand-primary)',
                          boxShadow: 'var(--brand-glow)',
                        }
                      : {
                          backgroundColor: '#1E293B',
                          borderColor: '#334155',
                        }
                  }
                  accessibilityLabel="Toggle Settings Drawer"
                >
                  <Sliders className="w-3.5 h-3.5" style={{ color: showSettingsDrawer ? '#000000' : '#FFFFFF' }} />
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: showSettingsDrawer ? '#000000' : '#FFFFFF' }}
                  >
                    {showSettingsDrawer ? 'Hide' : 'Controls'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={resetPractice}
                  className="p-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  accessibilityLabel="Restart Song"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                </Pressable>
              </View>
            </View>

            {/* Expanded Drawer: Repertoire Carousel, Mode, Hand, Speed, Metronome */}
            {showSettingsDrawer && (
              <View className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                {/* Horizontal Repertoire Carousel */}
                <View className="flex flex-row items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
                  {PUBLIC_DOMAIN_SONGS.map((song) => (
                    <Pressable
                      key={song.id}
                      onPress={() => {
                        setSelectedSong(song);
                        resetPractice();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-semibold border shrink-0 ${
                        selectedSong.id === song.id
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <Text className="text-xs text-white">{song.title}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Mode, Hand, Speed, Metronome Row */}
                <View className="flex flex-row items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                  <View className="flex flex-row items-center gap-1">
                    <Text className="text-[11px] text-slate-400">Mode:</Text>
                    <Pressable
                      onPress={() => setPracticeMode('wait')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        practiceMode === 'wait'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Text className="text-[11px] text-white">Wait</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPracticeMode('tempo')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        practiceMode === 'tempo'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Text className="text-[11px] text-white">Tempo</Text>
                    </Pressable>
                  </View>

                  <View className="flex flex-row items-center gap-1">
                    <Text className="text-[11px] text-slate-400">Hand:</Text>
                    {(['right', 'left', 'both'] as HandType[]).map((h) => (
                      <Pressable
                        key={h}
                        onPress={() => setHandFocus(h)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          handFocus === h
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Text className="text-[11px] text-white capitalize">{h}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={toggleMetronome}
                    className={`flex flex-row items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold ${
                      isMetronomeActive
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Text className="text-[11px] text-white">Metronome</Text>
                    <View
                      className={`w-1.5 h-1.5 rounded-full ${
                        isMetronomeActive && currentBeat === 0
                          ? 'bg-amber-400 scale-125'
                          : 'bg-slate-600'
                      }`}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Grand Staff Sheet Music */}
          <StaffSheetMusic
            notes={selectedSong.notes}
            currentNoteIndex={currentNoteIndex}
            timeSignature={selectedSong.timeSignature}
            keySignature={selectedSong.keySignature}
            onSelectNote={(idx) => setCurrentNoteIndex(idx)}
          />

          {/* Falling Notes Track */}
          <FallingNotesView
            notes={selectedSong.notes}
            currentNoteIndex={currentNoteIndex}
            lastFeedback={lastFeedback}
            mode={practiceMode}
          />
        </ScrollView>
      )}

      {/* Ear Training Subview */}
      {activeSubView === 'ear_training' && (
        <ScrollView className="flex-1 w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <Headphones className="w-5 h-5 text-indigo-400" />
                <Text className="text-white font-bold text-base">Ear Training: Chord Quality</Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/40">
                <Text className="text-indigo-300 text-xs font-bold">Score: {earScore}</Text>
              </View>
            </View>

            <Text className="text-slate-300 text-xs leading-relaxed">
              Listen to the triad chord and determine whether it sounds cheerful (Major) or melancholic (Minor).
            </Text>

            <Pressable
              onPress={playEarChord}
              className="py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex flex-row items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5 text-white fill-current" />
              <Text className="text-white font-bold text-sm">Play Mystery Triad</Text>
            </Pressable>

            <View className="grid grid-cols-2 gap-3 mt-2">
              <Pressable
                onPress={() => checkEarAnswer('Major')}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center"
              >
                <Text className="text-white font-bold text-sm">Major (Bright / Happy)</Text>
              </Pressable>

              <Pressable
                onPress={() => checkEarAnswer('Minor')}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center"
              >
                <Text className="text-white font-bold text-sm">Minor (Mellow / Sad)</Text>
              </Pressable>
            </View>

            {earFeedback && (
              <View className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-center">
                <Text className="text-indigo-200 text-xs font-medium">{earFeedback}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Scale & Chord Finder Subview */}
      {activeSubView === 'theory_tools' && (
        <ScrollView className="flex-1 w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <View className="flex flex-row items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <Text className="text-white font-bold text-base">Scale &amp; Chord Explorer</Text>
            </View>

            {/* Root Note Selector */}
            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold">Select Root Key:</Text>
              <View className="flex flex-row flex-wrap gap-1.5">
                {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => updateScaleFinder(r, selectedScaleType)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border ${
                      selectedRoot === r
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Text className="text-xs font-bold text-white">{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Scale Type Selector */}
            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold">Scale Type:</Text>
              <View className="flex flex-row gap-2">
                {(['major', 'minor', 'pentatonic'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => updateScaleFinder(selectedRoot, t)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs capitalize border ${
                      selectedScaleType === t
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <Text className="text-xs text-white capitalize">{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Scale Notes Display */}
            <View className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
              <Text className="text-xs text-slate-400">
                Notes in {selectedRoot} {selectedScaleType} Scale:
              </Text>
              <View className="flex flex-row flex-wrap gap-2">
                {activeTheoryNotes.map((n, i) => (
                  <View
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40"
                  >
                    <Text className="text-indigo-200 font-mono font-bold text-xs">{n}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              onPress={playScaleNotes}
              className="py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow"
            >
              <Text className="text-white font-bold text-xs">Arpeggiate Scale Notes</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* On-Screen Multi-Touch Piano Keyboard */}
      <PianoKeyboard
        targetNotes={currentTargetNote ? [currentTargetNote] : []}
        targetFingerMap={currentTargetNote ? { [currentTargetNote]: currentFinger } : {}}
        onNotePress={handleNoteInput}
      />
    </View>
  );
};
