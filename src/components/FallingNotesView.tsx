import React from 'react';
import { View, Text } from './native-ui.tsx';
import { PracticeNote } from '../types/index.ts';
import { getNoteColour, noteToMidi } from '../utils/musicLogic.ts';

interface FallingNotesViewProps {
  notes: PracticeNote[];
  currentNoteIndex: number;
  showNoteNames?: boolean;
  colourCodedNotes?: boolean;
  showFingerNumbers?: boolean;
  lastFeedback?: 'perfect' | 'good' | 'miss' | null;
  mode: 'wait' | 'tempo';
}

export const FallingNotesView: React.FC<FallingNotesViewProps> = ({
  notes,
  currentNoteIndex,
  showNoteNames = true,
  colourCodedNotes = true,
  showFingerNumbers = true,
  lastFeedback,
  mode,
}) => {
  const currentNote = notes[currentNoteIndex];
  // Visible upcoming notes
  const visibleNotes = notes.slice(Math.max(0, currentNoteIndex), currentNoteIndex + 4);

  return (
    <View
      className="w-full rounded-2xl border p-3 shadow-inner flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--surface-elevated)',
        borderColor: 'rgba(var(--brand-primary-rgb), 0.25)',
      }}
    >
      {/* Top Banner: Mode Indicator & Target Note Badge */}
      <View className="flex flex-row items-center justify-between px-1">
        <View className="flex flex-row items-center gap-1.5">
          <View
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          />
          <Text className="text-xs font-semibold text-slate-300">Falling Notes</Text>
          <Text className="text-[10px] text-slate-400">
            ({mode === 'wait' ? 'Wait Mode' : 'Tempo Mode'})
          </Text>
        </View>

        <View className="flex flex-row items-center gap-2">
          {lastFeedback && (
            <View
              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                lastFeedback === 'perfect'
                  ? 'bg-emerald-950/80 border-[#10B981]/50 text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : lastFeedback === 'good'
                  ? 'bg-amber-950/80 border-[#F59E0B]/50 text-[#F59E0B]'
                  : 'bg-rose-950/80 border-[#EF4444]/50 text-[#EF4444]'
              }`}
            >
              <Text>
                {lastFeedback === 'perfect' ? 'Spot On!' : lastFeedback === 'good' ? 'Good!' : 'Retry'}
              </Text>
            </View>
          )}

          {currentNote && (
            <View
              className="flex flex-row items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: 'rgba(var(--brand-primary-rgb), 0.15)',
                borderColor: 'rgba(var(--brand-primary-rgb), 0.4)',
                color: 'var(--brand-primary)',
              }}
            >
              {showFingerNumbers && currentNote.finger && (
                <View
                  className="w-4 h-4 rounded-full text-slate-950 text-[10px] flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Text className="text-slate-950 font-bold text-[10px]">{currentNote.finger}</Text>
                </View>
              )}
              <Text className="font-bold text-xs" style={{ color: 'var(--brand-primary)' }}>
                {currentNote.note}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Falling Notes Drop Track (Dedicated Height with overflow hidden) */}
      <View className="relative w-full h-24 bg-[#0B0710]/95 rounded-xl border border-white/10 overflow-hidden flex flex-col justify-end">
        {/* Vertical note lane guidelines */}
        <View className="absolute inset-0 flex flex-row justify-around opacity-15">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((lane) => (
            <View
              key={lane}
              className="w-[1px] h-full border-dashed"
              style={{ backgroundColor: 'var(--brand-secondary)', opacity: 0.3 }}
            />
          ))}
        </View>

        {/* Falling Note Blocks */}
        <View className="relative w-full h-full">
          {visibleNotes.map((n, i) => {
            const isTarget = i === 0;
            // 0 is at hit bar (bottom: 4px), subsequent notes higher up (28px, 56px...)
            const bottomOffsetPx = 4 + i * 26;
            const midi = noteToMidi(n.note);
            const isLeftHand = n.hand === 'left' || (!n.hand && midi < 60);
            // Dynamic theme: Left hand uses var(--brand-secondary), Right hand uses var(--brand-primary)
            const handColour = isLeftHand ? 'var(--brand-secondary)' : 'var(--brand-primary)';
            const noteColour = colourCodedNotes ? getNoteColour(n.note) : handColour;
            // Horizontal lane based on note semitones relative to Middle C
            const lanePercent = Math.max(15, Math.min(85, 50 + (midi - 60) * 5));

            return (
              <View
                key={`${n.note}-${i}`}
                className={`absolute transition-all duration-200 flex flex-col items-center ${
                  isTarget ? 'scale-105 z-20' : 'opacity-70'
                }`}
                style={{
                  left: `${lanePercent}%`,
                  bottom: `${bottomOffsetPx}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Note Block */}
                <View
                  className={`rounded-lg px-2 py-1 flex flex-row items-center gap-1 shadow-md border ${
                    isTarget ? 'ring-2 ring-white border-white' : 'border-white/10'
                  }`}
                  style={{
                    backgroundColor: noteColour,
                    minWidth: '38px',
                    height: '24px',
                    ...(isTarget ? { boxShadow: 'var(--brand-glow)' } : {}),
                  }}
                >
                  {showFingerNumbers && n.finger && (
                    <View className="w-3.5 h-3.5 rounded-full bg-slate-950/80 flex items-center justify-center">
                      <Text className="text-[8px] font-bold text-white">{n.finger}</Text>
                    </View>
                  )}
                  {showNoteNames && (
                    <Text className="text-[10px] font-black text-slate-950 tracking-tight">
                      {n.note}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Target Hit Bar Line */}
        <View
          className="w-full flex flex-row items-center justify-between px-2 py-0.5 border-t bg-[#0B0710]/80 relative z-10"
          style={{
            borderColor: 'var(--brand-primary)',
            boxShadow: '0 -2px 10px rgba(var(--brand-primary-rgb), 0.2)',
          }}
        >
          <Text
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--brand-primary)' }}
          >
            Hit Zone
          </Text>
          <View
            className="flex-1 mx-2 h-[1px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--brand-primary) 50%, transparent 100%)',
            }}
          />
          <Text
            className="text-[9px] font-mono font-bold"
            style={{ color: 'var(--brand-primary)' }}
          >
            Middle C
          </Text>
        </View>
      </View>
    </View>
  );
};
