import React from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { PracticeNote } from '../types/index.ts';
import { getNoteColour, noteToMidi } from '../utils/musicLogic.ts';

interface StaffSheetMusicProps {
  notes: PracticeNote[];
  currentNoteIndex: number;
  showNoteNames?: boolean;
  colourCodedNotes?: boolean;
  showFingerNumbers?: boolean;
  timeSignature?: string;
  keySignature?: string;
  onSelectNote?: (index: number) => void;
  lastFeedback?: 'perfect' | 'good' | 'miss' | null;
}

export const StaffSheetMusic: React.FC<StaffSheetMusicProps> = ({
  notes,
  currentNoteIndex,
  showNoteNames = true,
  colourCodedNotes = true,
  showFingerNumbers = true,
  timeSignature = '4/4',
  keySignature = 'C Major',
  onSelectNote,
  lastFeedback = null,
}) => {
  // Line positions for Treble staff (F5 down to E4)
  // Midi mapping for staff line positioning
  const calculateYPosition = (note: string): { clef: 'treble' | 'bass'; offset: number; needsLedger: boolean } => {
    const midi = noteToMidi(note);

    if (midi >= 60) {
      // Treble Clef: Middle C (60) is below the staff, E4 (64) is line 1, G4 (67) line 2, B4 (71) line 3, D5 (74) line 4, F5 (77) line 5
      // Each diatonic step is roughly 7px
      const stepsAboveMiddleC = (midi - 60);
      const yOffset = 70 - stepsAboveMiddleC * 4.2;
      return { clef: 'treble', offset: yOffset, needsLedger: midi === 60 || midi <= 61 || midi >= 81 };
    } else {
      // Bass Clef: Middle C (60) is above the staff, A3 (57) line 5, F3 (53) line 4, D3 (50) line 3, B2 (47) line 2, G2 (43) line 1
      const stepsBelowMiddleC = (60 - midi);
      const yOffset = 15 + stepsBelowBelow(stepsBelowMiddleC);
      return { clef: 'bass', offset: yOffset, needsLedger: midi === 60 || midi >= 59 || midi <= 40 };
    }
  };

  const stepsBelowBelow = (diff: number) => diff * 4.2;

  return (
    <View className="w-full bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col">
      {/* Staff Header: Key Signature, Time Signature & Clef Legend */}
      <View className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
        <View className="flex flex-row items-center gap-3">
          <View className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            <Text className="text-slate-300 font-mono text-xs font-bold">{keySignature}</Text>
          </View>
          <View className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            <Text className="text-slate-300 font-mono text-xs font-bold">{timeSignature}</Text>
          </View>
        </View>

        <View className="flex flex-row items-center gap-2">
          <Text className="text-[11px] text-slate-400 font-medium">Grand Staff (Treble &amp; Bass)</Text>
        </View>
      </View>

      {/* Grand Staff Canvas Area */}
      <View className="relative w-full overflow-x-auto hide-scrollbar py-2 min-h-[210px]">
        <View className="min-w-[580px] relative flex flex-col h-[200px]">
          {/* Treble Clef Staff (5 Lines) */}
          <View className="relative h-24 flex flex-col justify-between mb-4 px-2">
            <View className="absolute left-2 top-2 z-10 flex flex-col items-center justify-center">
              <Text className="text-2xl font-serif text-indigo-400 select-none">𝄞</Text>
            </View>
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
          </View>

          {/* Middle C Division Line / System Divider */}
          <View className="w-full h-[1px] border-b border-dashed border-slate-700/60 my-1" />

          {/* Bass Clef Staff (5 Lines) */}
          <View className="relative h-24 flex flex-col justify-between mt-4 px-2">
            <View className="absolute left-2 top-2 z-10 flex flex-col items-center justify-center">
              <Text className="text-2xl font-serif text-sky-400 select-none">𝄢</Text>
            </View>
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
            <View className="w-full h-[1.5px] bg-slate-600" />
          </View>

          {/* Notes Rendered Over the Staves */}
          <View className="absolute inset-0 pl-16 pr-6 flex flex-row items-center">
            {notes.map((n, idx) => {
              const isCurrent = idx === currentNoteIndex;
              const isPast = idx < currentNoteIndex;
              const pos = calculateYPosition(n.note);
              const noteColour = colourCodedNotes ? getNoteColour(n.note) : '#ffffff';

              // Position calculation
              const topPx = pos.clef === 'treble' ? Math.max(10, Math.min(85, pos.offset)) : 115 + Math.min(80, pos.offset);

              return (
                <Pressable
                  key={idx}
                  onPress={() => onSelectNote && onSelectNote(idx)}
                  className={`relative flex flex-col items-center mx-3 transition-transform ${
                    isCurrent ? 'scale-110 z-20' : 'opacity-85'
                  }`}
                  style={{
                    position: 'relative',
                    height: '210px',
                  }}
                  accessibilityLabel={`Note ${n.note}`}
                >
                  {/* Current Active Playhead Glow Indicator */}
                  {isCurrent && (
                    <View className="absolute -top-1 w-8 h-[200px] bg-indigo-500/10 rounded-full border border-indigo-400/40 pointer-events-none" />
                  )}

                  {/* Note Body positioned vertically */}
                  <View
                    className="absolute flex flex-col items-center"
                    style={{ top: `${topPx}px` }}
                  >
                    {/* Optional Ledger Line for Middle C */}
                    {pos.needsLedger && (
                      <View className="absolute -top-1 w-6 h-[2px] bg-slate-400" />
                    )}

                    {/* Finger Guide Pill */}
                    {showFingerNumbers && n.finger && (
                      <View className="absolute -top-6 w-4 h-4 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                        <Text className="text-[9px] font-bold text-slate-200">{n.finger}</Text>
                      </View>
                    )}

                    {/* Note Head Oval */}
                    <View
                      className={`w-4 h-3 rounded-full border shadow-sm transition-colors ${
                        isCurrent
                          ? lastFeedback === 'perfect'
                            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                            : lastFeedback === 'miss'
                            ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-900 shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                            : 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : isPast
                          ? 'opacity-60'
                          : ''
                      }`}
                      style={{
                        backgroundColor: isCurrent
                          ? lastFeedback === 'perfect'
                            ? '#10B981'
                            : lastFeedback === 'miss'
                            ? '#EF4444'
                            : '#ffffff'
                          : noteColour,
                        borderColor: isCurrent
                          ? lastFeedback === 'perfect'
                            ? '#059669'
                            : lastFeedback === 'miss'
                            ? '#DC2626'
                            : 'var(--brand-primary)'
                          : '#1e293b',
                        transform: 'rotate(-20deg)',
                      }}
                    />

                    {/* Note Stem */}
                    <View
                      className="absolute right-0 bottom-1.5 w-[2px] h-7"
                      style={{
                        backgroundColor:
                          isCurrent && lastFeedback === 'perfect'
                            ? '#10B981'
                            : isCurrent && lastFeedback === 'miss'
                            ? '#EF4444'
                            : '#cbd5e1',
                      }}
                    />

                    {/* Note Name Label */}
                    {showNoteNames && (
                      <Text
                        className={`mt-6 text-[10px] font-bold ${
                          isCurrent ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {n.note}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};
