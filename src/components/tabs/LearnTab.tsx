import React from 'react';
import { View, Text, Pressable, ScrollView } from '../native-ui.tsx';
import { CURRICULUM_LEVELS, PUBLIC_DOMAIN_SONGS } from '../../data/curriculum.ts';
import { Lesson, Song, UserProfile } from '../../types/index.ts';
import { CheckCircle, Lock, Play, Star, BookOpen, Music2, Sparkles, ChevronRight } from 'lucide-react';

import { DailyGoalRing } from '../DailyGoalRing.tsx';
import { Flame } from 'lucide-react';
import { AvatarDisplay } from '../AvatarDisplay.tsx';

interface LearnTabProps {
  userProfile: UserProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onSelectSong: (song: Song) => void;
  onOpenProfile?: () => void;
}

export const LearnTab: React.FC<LearnTabProps> = ({
  userProfile,
  onSelectLesson,
  onSelectSong,
  onOpenProfile,
}) => {
  const currentLevel = CURRICULUM_LEVELS[0]; // Level 1 Foundations

  return (
    <ScrollView className="w-full flex-1 p-4 pb-24 gap-5">
      {/* Active Musician Profile Banner */}
      <View
        className="w-full rounded-3xl bg-[#161021] border border-[#FF1E8E]/20 p-4 flex flex-row items-center justify-between shadow-xl"
      >
        <Pressable
          onPress={onOpenProfile}
          className="flex flex-row items-center gap-3.5 text-left hover:opacity-90 transition-opacity"
          accessibilityLabel="Open Musician Profile"
        >
          <AvatarDisplay
            avatar={userProfile.avatar}
            size="md"
            className="bg-white/5 border border-white/10"
            iconClassName="text-[#FF1E8E] stroke-[2.2]"
          />
          <View className="flex flex-col">
            <View className="flex flex-row items-center gap-2">
              <Text className="text-white font-bold text-sm tracking-tight">{userProfile.name}</Text>
              <View className="px-2.5 py-0.5 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
                <Text className="text-[10px] font-bold text-[#FF1E8E]">Level {userProfile.level}</Text>
              </View>
            </View>
            <View className="flex flex-row items-center gap-2 text-xs text-slate-400 mt-0.5">
              <View className="flex flex-row items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <Text className="text-white font-bold text-xs">{userProfile.xp} XP</Text>
              </View>
              <Text className="text-slate-600">·</Text>
              <View className="flex flex-row items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                <Text className="text-[#F59E0B] font-bold text-xs">{userProfile.currentStreak}d Streak</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Daily XP Goal Ring */}
        <DailyGoalRing
          earnedToday={userProfile.dailyXpEarnedToday}
          dailyTarget={userProfile.dailyXpTarget || 60}
          size={34}
        />
      </View>

      {/* Learning Path Banner */}
      <View className="w-full rounded-3xl bg-gradient-to-br from-[#161021] via-[#23112B] to-[#0B0710] p-5 border border-[#FF1E8E]/30 shadow-xl flex flex-col gap-2">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm tracking-wide uppercase">
              {currentLevel.title}
            </Text>
          </View>
          <View className="px-2.5 py-0.5 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
            <Text className="text-[#FF1E8E] text-xs font-semibold">10 Lessons Active</Text>
          </View>
        </View>

        <Text className="text-slate-300 text-xs leading-relaxed">
          {currentLevel.description} Progress through each unit to unlock songs and chord pads in the studio.
        </Text>
      </View>

      {/* Duolingo-style Unit & Lesson Roadmap */}
      {currentLevel.units.map((unit, unitIdx) => (
        <View key={unit.id} className="flex flex-col gap-3">
          {/* Unit Header */}
          <View className="flex flex-row items-center justify-between px-1">
            <View className="flex flex-col">
              <Text className="text-white font-bold text-sm">
                Unit {unitIdx + 1}: {unit.title}
              </Text>
              <Text className="text-slate-400 text-xs">{unit.description}</Text>
            </View>
          </View>

          {/* Lessons List in Unit */}
          <View className="flex flex-col gap-2.5">
            {unit.lessons.map((lesson, lessonIdx) => {
              const completedData = userProfile.completedLessons[lesson.id];
              const isCompleted = !!completedData;
              const stars = completedData?.stars || lesson.stars || 0;

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => onSelectLesson(lesson)}
                  className={`w-full p-4 rounded-2xl border transition-all flex flex-row items-center justify-between shadow-sm ${
                    isCompleted
                      ? 'bg-[#161021]/80 border-white/10 hover:border-white/20'
                      : 'bg-[#161021] border-[#FF1E8E]/40 hover:border-[#FF1E8E]'
                  }`}
                  accessibilityLabel={`Lesson: ${lesson.title}`}
                >
                  <View className="flex flex-row items-center gap-3.5">
                    {/* Lesson Status Pip / Number */}
                    <View
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isCompleted
                          ? 'bg-emerald-950/80 border border-[#10B981]/50 text-[#10B981]'
                          : 'bg-[#FF1E8E] text-white shadow-md shadow-[#FF1E8E]/30'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      ) : (
                        <Text className="text-white font-bold text-xs">{lessonIdx + 1}</Text>
                      )}
                    </View>

                    {/* Lesson Title & Details */}
                    <View className="flex flex-col">
                      <Text className="text-white font-bold text-sm leading-snug">
                        {lesson.title}
                      </Text>
                      <Text className="text-slate-400 text-xs leading-normal">
                        {lesson.subtitle}
                      </Text>
                      <View className="flex flex-row items-center gap-3 mt-1 text-[11px] text-slate-400">
                        <Text className="text-slate-400">~{lesson.durationMin} mins</Text>
                        <Text className="text-slate-600">·</Text>
                        <Text className="text-[#FF1E8E] font-semibold">+{lesson.xpReward} XP</Text>
                      </View>
                    </View>
                  </View>

                  {/* Right side: Stars or Start Arrow */}
                  <View className="flex flex-row items-center gap-1.5">
                    {isCompleted ? (
                      <View className="flex flex-row items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= stars ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </View>
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-[#FF1E8E]/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#FF1E8E] fill-current ml-0.5" />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Song Repertoire Library Section */}
      <View className="flex flex-col gap-3 mt-4">
        <View className="flex flex-row items-center justify-between px-1">
          <View className="flex flex-row items-center gap-2">
            <Music2 className="w-4 h-4 text-[#FF1E8E]" />
            <Text className="text-white font-bold text-sm">Song Library (Public Domain)</Text>
          </View>
          <Text className="text-xs text-slate-400">Level 1 &amp; 2 Repertoire</Text>
        </View>

        <View className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PUBLIC_DOMAIN_SONGS.map((song) => (
            <Pressable
              key={song.id}
              onPress={() => onSelectSong(song)}
              className="p-4 rounded-2xl bg-[#161021] border border-white/10 hover:border-[#FF1E8E]/40 flex flex-col justify-between gap-2.5 shadow-sm"
              accessibilityLabel={`Practise Song ${song.title}`}
            >
              <View className="flex flex-row items-start justify-between">
                <View className="flex flex-col">
                  <Text className="text-white font-bold text-sm">{song.title}</Text>
                  <Text className="text-slate-400 text-xs">{song.composer}</Text>
                </View>
                <View className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  <Text className="text-[10px] font-semibold text-slate-300">{song.difficulty}</Text>
                </View>
              </View>

              <Text className="text-slate-400 text-xs leading-normal">{song.description}</Text>

              <View className="flex flex-row items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
                <Text className="text-slate-400 tabular-nums">
                  {song.bpm} BPM · {song.timeSignature} · {song.keySignature}
                </Text>
                <View className="flex flex-row items-center gap-1 text-[#FF1E8E] font-semibold">
                  <Text className="text-[#FF1E8E] font-semibold">Practise</Text>
                  <ChevronRight className="w-3.5 h-3.5 text-[#FF1E8E]" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Curriculum Levels 2 through 5 Preview */}
      <View className="flex flex-col gap-3 mt-4">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Upcoming Curriculum Levels
        </Text>

        {CURRICULUM_LEVELS.slice(1).map((lvl) => (
          <View
            key={lvl.id}
            className="p-4 rounded-2xl bg-[#161021]/50 border border-white/5 flex flex-row items-center justify-between opacity-70"
          >
            <View className="flex flex-col">
              <Text className="text-white font-bold text-sm">{lvl.title}</Text>
              <Text className="text-slate-400 text-xs">{lvl.description}</Text>
            </View>
            <Lock className="w-4 h-4 text-slate-600" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
