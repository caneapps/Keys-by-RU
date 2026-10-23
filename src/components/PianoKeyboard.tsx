import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { getNoteColour } from '../utils/musicLogic.ts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { haptics } from '../utils/haptics.ts';

interface PianoKeyboardProps {
  activeNotes?: string[]; // notes currently pressed or triggered
  targetNotes?: string[]; // notes user needs to press for practice/lesson
  targetFingerMap?: Record<string, number>; // e.g. { "C4": 1, "E4": 3 }
  onNotePress: (note: string) => void;
  onNoteRelease?: (note: string) => void;
  showNoteNames?: boolean;
  colourCodedNotes?: boolean;
  showFingerNumbers?: boolean;
  keySize?: 'compact' | 'normal' | 'large';
  startOctave?: number; // default 3 or 4
}

interface KeyConfig {
  note: string;
  isBlack: boolean;
  nameOnly: string;
  octave: number;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes = [],
  targetNotes = [],
  targetFingerMap = {},
  onNotePress,
  onNoteRelease,
  showNoteNames = true,
  colourCodedNotes = true,
  showFingerNumbers = true,
  keySize = 'normal',
  startOctave = 4,
}) => {
  const [octave, setOctave] = useState(startOctave);
  const [currentlyPressed, setCurrentlyPressed] = useState<Set<string>>(new Set());

  // Generate 1 full octave plus top C to perfectly fit mobile screen (C to C')
  const whiteNotesList = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackNotesMap: Record<string, string> = {
    C: 'C#',
    D: 'D#',
    F: 'F#',
    G: 'G#',
    A: 'A#',
  };

  const handlePointerDown = (note: string) => {
    haptics.trigger('key');
    setCurrentlyPressed((prev) => new Set(prev).add(note));
    onNotePress(note);
  };

  const handlePointerUp = (note: string) => {
    setCurrentlyPressed((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    if (onNoteRelease) onNoteRelease(note);
  };

  // Compute key dimensions: 44px touch targets on mobile
  const whiteKeyWidth = keySize === 'compact' ? 40 : keySize === 'large' ? 48 : 44;
  const whiteKeyHeight = keySize === 'compact' ? 120 : keySize === 'large' ? 160 : 135;
  const blackKeyWidth = Math.round(whiteKeyWidth * 0.62);
  const blackKeyHeight = Math.round(whiteKeyHeight * 0.62);

  // Keyboard navigation for computer testing (A, S, D, F, G, H, J...)
  useEffect(() => {
    const keyMap: Record<string, string> = {
      a: `C${octave}`,
      w: `C#${octave}`,
      s: `D${octave}`,
      e: `D#${octave}`,
      d: `E${octave}`,
      f: `F${octave}`,
      t: `F#${octave}`,
      g: `G${octave}`,
      y: `G#${octave}`,
      h: `A${octave}`,
      u: `A#${octave}`,
      j: `B${octave}`,
      k: `C${octave + 1}`,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const note = keyMap[e.key.toLowerCase()];
      if (note && !e.repeat) {
        handlePointerDown(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyMap[e.key.toLowerCase()];
      if (note) {
        handlePointerUp(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octave]);

  const octavesToRender = [octave, octave + 1];

  return (
    <View className="w-full flex flex-col items-center select-none bg-slate-950 p-2 border-t border-slate-800">
      {/* Octave Selector & Key Settings Header */}
      <View className="w-full max-w-xl flex flex-row items-center justify-between mb-2 px-2">
        <View className="flex flex-row items-center gap-2">
          <Pressable
            onPress={() => setOctave((prev) => Math.max(2, prev - 1))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs flex flex-row items-center gap-1 border border-slate-700"
            accessibilityLabel="Shift Octave Down"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
            <Text className="text-slate-300 font-semibold text-xs">Octave -</Text>
          </Pressable>

          <View className="px-3 py-1 rounded bg-slate-900 border border-slate-800">
            <Text className="text-indigo-300 text-xs font-mono font-bold">
              C{octave} — C{octave + 1}
            </Text>
          </View>

          <Pressable
            onPress={() => setOctave((prev) => Math.min(5, prev + 1))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs flex flex-row items-center gap-1 border border-slate-700"
            accessibilityLabel="Shift Octave Up"
          >
            <Text className="text-slate-300 font-semibold text-xs">Octave +</Text>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Pressable>
        </View>

        <View className="flex flex-row items-center gap-2">
          {octave === 4 && (
            <View className="flex flex-row items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30">
              <View className="w-2 h-2 rounded-full bg-indigo-400" />
              <Text className="text-[10px] text-indigo-200 font-semibold">Middle C Centred</Text>
            </View>
          )}
        </View>
      </View>

      {/* Piano Keys Container */}
      <View className="w-full flex justify-center py-1">
        <View className="relative flex flex-row rounded-b-xl shadow-2xl p-1 bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-800">
          {[...whiteNotesList.map((n) => ({ note: `${n}${octave}`, name: n })), { note: `C${octave + 1}`, name: 'C' }].map((k) => {
            const fullWhiteNote = k.note;
            const whiteName = k.name;
            const hasBlackNote = k.note !== `C${octave + 1}` ? blackNotesMap[whiteName] : null;
            const fullBlackNote = hasBlackNote ? `${hasBlackNote}${octave}` : null;

              const isWhiteActive = currentlyPressed.has(fullWhiteNote) || activeNotes.includes(fullWhiteNote);
              const isWhiteTarget = targetNotes.includes(fullWhiteNote);
              const whiteFinger = targetFingerMap[fullWhiteNote];
              const whiteColour = getNoteColour(whiteName);

              return (
                <View key={fullWhiteNote} className="relative flex flex-col">
                  {/* White Key */}
                  <Pressable
                    onPointerDown={() => handlePointerDown(fullWhiteNote)}
                    onPointerUp={() => handlePointerUp(fullWhiteNote)}
                    onPointerLeave={() => handlePointerUp(fullWhiteNote)}
                    style={{
                      width: `${whiteKeyWidth}px`,
                      height: `${whiteKeyHeight}px`,
                      ...(isWhiteActive
                        ? {
                            backgroundColor: 'var(--brand-primary)',
                            boxShadow: 'var(--brand-glow)',
                            borderColor: 'var(--brand-primary)',
                          }
                        : {}),
                    }}
                    className={`relative rounded-b-lg border-x border-b transition-all flex flex-col justify-end items-center pb-2 ${
                      isWhiteActive
                        ? 'scale-[0.98]'
                        : isWhiteTarget
                        ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                        : 'bg-gradient-to-b from-slate-100 via-white to-slate-200 border-slate-300 shadow-sm active:bg-slate-300'
                    }`}
                    accessibilityLabel={`Piano Key ${fullWhiteNote}`}
                  >
                    {/* Target highlight pulsing glow */}
                    {isWhiteTarget && (
                      <View className="absolute top-2 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                    )}

                    {/* Finger Number Guide */}
                    {showFingerNumbers && whiteFinger && (
                      <View className="mb-1 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shadow">
                        <Text className="text-white text-[10px] font-bold">{whiteFinger}</Text>
                      </View>
                    )}

                    {/* Note Name Label & Colour Pip */}
                    {showNoteNames && (
                      <View className="flex flex-col items-center">
                        {colourCodedNotes && (
                          <View
                            className="w-2.5 h-2.5 rounded-full mb-0.5 shadow-xs"
                            style={{ backgroundColor: whiteColour }}
                          />
                        )}
                        <Text
                          className={`font-bold text-xs tracking-tight ${
                            isWhiteActive ? 'text-slate-950 font-black' : 'text-slate-900'
                          }`}
                        >
                          {fullWhiteNote}
                        </Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Black Key Overlay */}
                  {fullBlackNote && (
                    <Pressable
                      onPointerDown={() => handlePointerDown(fullBlackNote)}
                      onPointerUp={() => handlePointerUp(fullBlackNote)}
                      onPointerLeave={() => handlePointerUp(fullBlackNote)}
                      style={{
                        position: 'absolute',
                        right: `-${Math.round(blackKeyWidth / 2)}px`,
                        top: 0,
                        width: `${blackKeyWidth}px`,
                        height: `${blackKeyHeight}px`,
                        zIndex: 20,
                        ...(currentlyPressed.has(fullBlackNote) || activeNotes.includes(fullBlackNote)
                          ? {
                              backgroundColor: 'var(--brand-primary)',
                              boxShadow: 'var(--brand-glow)',
                              borderColor: 'var(--brand-primary)',
                            }
                          : {}),
                      }}
                      className={`rounded-b-md shadow-xl transition-all flex flex-col justify-end items-center pb-1.5 border-x border-b ${
                        currentlyPressed.has(fullBlackNote) || activeNotes.includes(fullBlackNote)
                          ? 'scale-[0.98]'
                          : targetNotes.includes(fullBlackNote)
                          ? 'bg-amber-600 border-amber-400 ring-2 ring-amber-400/60'
                          : 'bg-gradient-to-b from-neutral-800 to-black border-neutral-900 active:bg-neutral-800'
                      }`}
                      accessibilityLabel={`Piano Key ${fullBlackNote}`}
                    >
                      {showFingerNumbers && targetFingerMap[fullBlackNote] && (
                        <View className="mb-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                          <Text className="text-white text-[9px] font-bold">
                            {targetFingerMap[fullBlackNote]}
                          </Text>
                        </View>
                      )}
                      {showNoteNames && (
                        <Text
                          className={`font-semibold text-[9px] scale-90 ${
                            currentlyPressed.has(fullBlackNote) || activeNotes.includes(fullBlackNote)
                              ? 'text-slate-950 font-black'
                              : 'text-slate-200'
                          }`}
                        >
                          {fullBlackNote}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
          })}
        </View>
      </View>
    </View>
  );
};
