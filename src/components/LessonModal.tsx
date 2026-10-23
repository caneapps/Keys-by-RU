import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { Lesson, PracticeNote } from '../types/index.ts';
import { StaffSheetMusic } from './StaffSheetMusic.tsx';
import { FallingNotesView } from './FallingNotesView.tsx';
import { PianoKeyboard } from './PianoKeyboard.tsx';
import { audioEngine } from '../audio/audioEngine.ts';
import { calculateStars, calculateXpReward } from '../utils/musicLogic.ts';
import { geminiCoach } from '../services/gemini.ts';
import { X, Play, Award, CheckCircle2, ChevronRight, HelpCircle, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LessonModalProps {
  lesson: Lesson;
  streak: number;
  onClose: () => void;
  onLessonComplete: (lessonId: string, stars: number, xpEarned: number) => void;
  colourCodedNotes?: boolean;
  showNoteNames?: boolean;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  streak,
  onClose,
  onLessonComplete,
  colourCodedNotes = true,
  showNoteNames = true,
}) => {
  // Lesson phases: 'theory' -> 'demo' -> 'practice' -> 'quiz' -> 'complete'
  const [phase, setPhase] = useState<'theory' | 'demo' | 'practice' | 'quiz' | 'complete'>('theory');

  // Demo playback state
  const [demoNoteIndex, setDemoNoteIndex] = useState<number>(-1);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);

  // Practice state
  const [practiceIndex, setPracticeIndex] = useState<number>(0);
  const [wrongNotesCount, setWrongNotesCount] = useState<number>(0);
  const [wrongNotesList, setWrongNotesList] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);

  // Quiz state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Coach feedback
  const [coachAdvice, setCoachAdvice] = useState<string>('');

  // Clean demo stop on unmount
  useEffect(() => {
    return () => {
      setIsDemoPlaying(false);
    };
  }, []);

  // Animated keyboard demonstration playback
  const runKeyboardDemo = async () => {
    setIsDemoPlaying(true);
    setPhase('demo');

    for (let i = 0; i < lesson.keyboardDemoNotes.length; i++) {
      const note = lesson.keyboardDemoNotes[i];
      setDemoNoteIndex(i);
      audioEngine.playPianoNote(note, '4n');
      await new Promise((r) => setTimeout(r, 650));
    }

    setDemoNoteIndex(-1);
    setIsDemoPlaying(false);
  };

  // Handle note pressed during guided practice
  const handlePracticeNotePress = (pressedNote: string) => {
    audioEngine.playPianoNote(pressedNote, '8n');

    if (phase !== 'practice') return;

    const targetNote = lesson.practiceNotes[practiceIndex]?.note;
    if (!targetNote) return;

    if (pressedNote === targetNote) {
      setLastFeedback('perfect');
      const nextIdx = practiceIndex + 1;
      setPracticeIndex(nextIdx);

      if (nextIdx >= lesson.practiceNotes.length) {
        // Practice phase successfully completed! Move to mini-quiz
        setTimeout(() => {
          setPhase('quiz');
        }, 600);
      }
    } else {
      setLastFeedback('miss');
      setWrongNotesCount((c) => c + 1);
      setWrongNotesList((list) => (list.includes(pressedNote) ? list : [...list, pressedNote]));
    }
  };

  const handleQuizSubmit = async () => {
    if (selectedQuizAnswer === null) return;
    setIsQuizSubmitted(true);

    const totalNotes = lesson.practiceNotes.length;
    const accuracy = Math.round(
      Math.max(40, ((totalNotes) / (totalNotes + wrongNotesCount)) * 100)
    );
    const stars = calculateStars(accuracy);
    const xpReward = calculateXpReward(lesson.xpReward, accuracy, streak);

    // Call Gemini coach service for pedagogical advice
    const advice = await geminiCoach.explainMistakes({
      lessonTitle: lesson.title,
      accuracy,
      wrongNotes: wrongNotesList,
      timingRating: accuracy >= 80 ? 'Crisp & Synchronised' : 'Slight Hesitation',
    });
    setCoachAdvice(advice);

    if (stars >= 1) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    onLessonComplete(lesson.id, stars, xpReward);
  };

  const currentTargetNote = lesson.practiceNotes[practiceIndex]?.note;
  const targetFingerMap = currentTargetNote
    ? { [currentTargetNote]: lesson.practiceNotes[practiceIndex]?.finger || 1 }
    : {};

  return (
    <View className="fixed inset-0 z-50 bg-[#0B0710]/95 backdrop-blur-md flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <View className="w-full bg-[#161021] border-b border-[#FF1E8E]/20 px-4 py-3 flex flex-row items-center justify-between">
        <View className="flex flex-col">
          <Text className="text-white font-bold text-sm">{lesson.title}</Text>
          <Text className="text-slate-400 text-xs">{lesson.subtitle}</Text>
        </View>

        <View className="flex flex-row items-center gap-2">
          <View className="px-2.5 py-1 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
            <Text className="text-[#FF1E8E] text-xs font-semibold uppercase tracking-wider">
              {phase === 'theory'
                ? '1. Theory'
                : phase === 'demo'
                ? '2. Keyboard Demo'
                : phase === 'practice'
                ? '3. Guided Practise'
                : phase === 'quiz'
                ? '4. Mini-Quiz'
                : 'Completed'}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10"
            accessibilityLabel="Close Lesson"
          >
            <X className="w-4 h-4 text-slate-300" />
          </Pressable>
        </View>
      </View>

      {/* Middle Interactive Content Area */}
      <View className="flex-1 w-full max-w-2xl mx-auto p-4 flex flex-col justify-start overflow-y-auto">
        {/* Phase 1: Theory Explanation */}
        {phase === 'theory' && (
          <View className="flex flex-col gap-4 bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-6 shadow-xl my-auto">
            <View className="w-12 h-12 rounded-2xl bg-[#FF1E8E]/15 border border-[#FF1E8E]/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#FF1E8E]" />
            </View>

            <View className="flex flex-col gap-1">
              <Text className="text-white text-lg font-bold font-heading">{lesson.title}</Text>
              <Text className="text-slate-400 text-xs font-medium">
                Lesson duration: ~{lesson.durationMin} minutes · Reward: +{lesson.xpReward} XP
              </Text>
            </View>

            <Text className="text-slate-300 text-sm leading-relaxed">{lesson.theoryText}</Text>

            <View className="flex flex-row gap-3 mt-4">
              <Pressable
                onPress={runKeyboardDemo}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF1E8E] hover:opacity-90 text-white font-bold text-sm flex flex-row items-center justify-center gap-2 shadow-md shadow-[#FF1E8E]/30"
              >
                <Play className="w-4 h-4 text-white fill-current" />
                <Text className="text-white font-bold text-sm">Watch Animated Demo</Text>
              </Pressable>

              <Pressable
                onPress={() => setPhase('practice')}
                className="py-3.5 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-sm flex flex-row items-center justify-center gap-1 border border-white/10"
              >
                <Text className="text-slate-200 font-semibold text-sm">Skip to Practise</Text>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Phase 2: Animated Keyboard Demo */}
        {phase === 'demo' && (
          <View className="flex flex-col gap-3 my-auto">
            <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-2xl p-4 flex flex-row items-center justify-between">
              <View className="flex flex-col">
                <Text className="text-white font-bold text-sm">Demonstrating Note Pattern</Text>
                <Text className="text-slate-400 text-xs">Observe the key highlights and finger rhythm</Text>
              </View>
              <Pressable
                onPress={() => setPhase('practice')}
                className="px-3.5 py-2 rounded-xl bg-[#FF1E8E] text-white font-bold text-xs shadow-sm shadow-[#FF1E8E]/30"
              >
                <Text className="text-white font-bold text-xs">Ready to Practise</Text>
              </Pressable>
            </View>

            {/* Falling notes demo */}
            <FallingNotesView
              notes={lesson.keyboardDemoNotes.map((n, i) => ({
                note: n,
                duration: 1,
                beatOffset: i,
              }))}
              currentNoteIndex={demoNoteIndex >= 0 ? demoNoteIndex : 0}
              colourCodedNotes={colourCodedNotes}
              showNoteNames={showNoteNames}
              mode="wait"
            />
          </View>
        )}

        {/* Phase 3: Guided Practice */}
        {phase === 'practice' && (
          <View className="flex flex-col gap-3">
            <View className="flex flex-row items-center justify-between px-1">
              <View className="flex flex-row items-center gap-2">
                <Text className="text-xs text-slate-400">Target Note:</Text>
                <View className="px-2.5 py-0.5 rounded-lg bg-[#FF1E8E] shadow-sm shadow-[#FF1E8E]/30">
                  <Text className="text-white font-mono font-bold text-sm">
                    {currentTargetNote || 'Finished!'}
                  </Text>
                </View>
              </View>

              <Text className="text-xs text-slate-400">
                Note {practiceIndex + 1} of {lesson.practiceNotes.length}
              </Text>
            </View>

            {/* Grand Staff synchronized view */}
            <StaffSheetMusic
              notes={lesson.practiceNotes}
              currentNoteIndex={practiceIndex}
              colourCodedNotes={colourCodedNotes}
              showNoteNames={showNoteNames}
            />

            {/* Falling notes visualizer */}
            <FallingNotesView
              notes={lesson.practiceNotes}
              currentNoteIndex={practiceIndex}
              colourCodedNotes={colourCodedNotes}
              showNoteNames={showNoteNames}
              lastFeedback={lastFeedback}
              mode="wait"
            />
          </View>
        )}

        {/* Phase 4: Mini-Quiz */}
        {phase === 'quiz' && (
          <View className="flex flex-col gap-4 bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-6 shadow-xl my-auto">
            <View className="flex flex-row items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#FF1E8E]" />
              <Text className="text-white font-bold text-base font-heading">Quick Knowledge Check</Text>
            </View>

            {lesson.quiz.map((q, qIdx) => (
              <View key={qIdx} className="flex flex-col gap-3">
                <Text className="text-slate-200 text-sm font-medium">{q.question}</Text>

                <View className="flex flex-col gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedQuizAnswer === optIdx;
                    const isCorrect = optIdx === q.correctIndex;

                    return (
                      <Pressable
                        key={optIdx}
                        onPress={() => !isQuizSubmitted && setSelectedQuizAnswer(optIdx)}
                        className={`p-3.5 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                          isQuizSubmitted
                            ? isCorrect
                              ? 'bg-emerald-950/80 border-[#10B981] text-white'
                              : isSelected
                              ? 'bg-rose-950/80 border-[#EF4444] text-white'
                              : 'bg-white/[0.02] border-white/5 text-slate-500'
                            : isSelected
                            ? 'bg-[#FF1E8E]/20 border-[#FF1E8E] text-white ring-1 ring-[#FF1E8E]/50'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <Text className="text-xs font-semibold text-white">{opt}</Text>
                        {isQuizSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {isQuizSubmitted && (
                  <View className="p-3 rounded-2xl bg-white/5 border border-white/10 mt-2">
                    <Text className="text-xs text-slate-300 leading-relaxed">{q.explanation}</Text>
                  </View>
                )}
              </View>
            ))}

            {!isQuizSubmitted ? (
              <Pressable
                onPress={handleQuizSubmit}
                disabled={selectedQuizAnswer === null}
                className="mt-2 py-3 rounded-2xl bg-[#FF1E8E] hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-[#FF1E8E]/30"
              >
                <Text className="text-white font-bold text-sm">Submit Answer</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setPhase('complete')}
                className="mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#D946EF] via-[#FF1E8E] to-[#FF0055] text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-[#FF1E8E]/30"
              >
                <Text className="text-white font-bold text-sm">View Mastery Results</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Phase 5: Complete & Coach Feedback */}
        {phase === 'complete' && (
          <View className="flex flex-col gap-4 bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-6 shadow-xl my-auto text-center">
            <View className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8 text-[#F59E0B]" />
            </View>

            <View className="flex flex-col gap-1 items-center">
              <Text className="text-white text-xl font-black font-heading">Lesson Mastered!</Text>
              <Text className="text-slate-400 text-xs">
                You earned +{lesson.xpReward} XP and advanced your daily streak.
              </Text>
            </View>

            {/* Stars */}
            <View className="flex flex-row justify-center gap-2 my-2">
              {[1, 2, 3].map((starIdx) => (
                <View
                  key={starIdx}
                  className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"
                >
                  <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
                </View>
              ))}
            </View>

            {/* Coach Feedback Box */}
            <View className="p-4 rounded-2xl bg-[#23112B]/75 border border-[#FF1E8E]/30 text-left flex flex-col gap-1">
              <View className="flex flex-row items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF1E8E]" />
                <Text className="text-[#FF1E8E] font-bold text-xs">Ru&apos;s Pedagogical Tip</Text>
              </View>
              <Text className="text-slate-300 text-xs leading-relaxed">
                {coachAdvice ||
                  'Keep those wrists supple and relaxed. Regular 5-minute practice sessions establish muscle memory faster than one long session.'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="mt-2 py-3.5 rounded-2xl bg-[#FF1E8E] hover:opacity-90 text-white font-bold text-sm shadow-md shadow-[#FF1E8E]/30"
            >
              <Text className="text-white font-bold text-sm">Back to Curriculum</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Multi-Touch Piano Keyboard */}
      <PianoKeyboard
        activeNotes={
          demoNoteIndex >= 0 && lesson.keyboardDemoNotes[demoNoteIndex]
            ? [lesson.keyboardDemoNotes[demoNoteIndex]]
            : []
        }
        targetNotes={currentTargetNote ? [currentTargetNote] : []}
        targetFingerMap={targetFingerMap}
        onNotePress={handlePracticeNotePress}
        colourCodedNotes={colourCodedNotes}
        showNoteNames={showNoteNames}
      />
    </View>
  );
};
