import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Image } from './native-ui.tsx';
import { UserProfile, AvatarConfig } from '../types/index.ts';
import { AVATAR_PRESETS } from '../services/storage.ts';
import { AVATAR_ICON_MAP } from './AvatarDisplay.tsx';
import {
  CheckCircle,
  Clock,
  Hand,
  Piano,
} from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

interface VectorAvatarChoice {
  id: string;
  label: string;
  iconName: string;
}

const MONOCHROME_AVATAR_LIST: VectorAvatarChoice[] = [
  { id: 'piano', label: 'Piano', iconName: 'piano' },
  { id: 'headphones', label: 'Headphones', iconName: 'headphones' },
  { id: 'music', label: 'Music', iconName: 'music' },
  { id: 'guitar', label: 'Guitar', iconName: 'guitar' },
  { id: 'mic', label: 'Mic', iconName: 'mic' },
  { id: 'disc', label: 'Disc', iconName: 'disc' },
  { id: 'sparkles', label: 'Sparkles', iconName: 'sparkles' },
  { id: 'zap', label: 'Zap', iconName: 'zap' },
  { id: 'radio', label: 'Radio', iconName: 'radio' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile.name || 'Pianist');
  const [avatar, setAvatar] = useState<AvatarConfig>(initialProfile.avatar || AVATAR_PRESETS[0]);
  const [skillLevel, setSkillLevel] = useState<UserProfile['skillLevel']>(initialProfile.skillLevel);
  const [goal, setGoal] = useState<UserProfile['goal']>(initialProfile.goal);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(initialProfile.dailyGoalMinutes);
  const [dailyXpTarget, setDailyXpTarget] = useState<number>(initialProfile.dailyXpTarget || 60);
  const [dominantHand, setDominantHand] = useState<UserProfile['dominantHand']>(initialProfile.dominantHand);
  const [reminderTime, setReminderTime] = useState<string>('18:30');

  const handleFinish = () => {
    onComplete({
      ...initialProfile,
      name: name.trim() || 'Pianist',
      avatar,
      skillLevel,
      goal,
      dailyGoalMinutes,
      dailyXpTarget,
      dominantHand,
      reminderTime,
    });
  };

  return (
    <View className="fixed inset-0 z-50 bg-[#0B0710]/85 backdrop-blur-md flex items-center justify-center p-4">
      <View className="w-full max-w-md bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col transition-all">
        {/* Prominent Top-Centre Brand Logo Emblem & Step Badge */}
        <View className="flex flex-col items-center justify-center text-center mb-5 relative">
          <View className="absolute right-0 top-0 px-2.5 py-0.5 rounded-full bg-[#FF1E8E]/15 border border-[#FF1E8E]/30">
            <Text className="text-[#FF1E8E] text-[11px] font-semibold tracking-wide font-mono">
              Step {step} of 5
            </Text>
          </View>

          {/* Prominent, standalone brand logo asset */}
          <Image
            src="./logo.png"
            alt="Keys by Ru Logo"
            className="w-16 h-16 rounded-2xl shadow-xl border border-white/10 mx-auto mb-4"
          />

          <Text className="text-white font-black text-xl font-heading tracking-tight">
            Welcome to Keys by Ru
          </Text>
          <Text className="text-slate-400 text-xs font-medium mt-0.5">
            Personalised Mobile Piano Studio &amp; Beat Production
          </Text>
        </View>

        {/* Step 1: Musician Identity & Monochrome Vector Avatar Picker */}
        {step === 1 && (
          <View className="flex flex-col gap-4">
            <Text className="text-slate-300 text-sm leading-relaxed">
              Create your musician profile. What should Ru call you on your piano journey?
            </Text>

            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-heading">
                Your Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Alex or Ru"
                className="text-base font-semibold focus:border-[#FF1E8E] focus:ring-[#FF1E8E]/50"
              />
            </View>

            <View className="flex flex-col gap-2 mt-1">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-heading">
                  Pick an Avatar
                </Text>
                <Text className="text-[11px] text-[#FF1E8E] font-medium">Monochrome Studio Icons</Text>
              </View>

              {/* Clean 3x3 Monochrome Vector Icon Grid */}
              <View className="grid grid-cols-3 gap-2.5">
                {MONOCHROME_AVATAR_LIST.map((av) => {
                  const IconComp = AVATAR_ICON_MAP[av.iconName] || Piano;
                  const isSelected =
                    avatar.icon === av.iconName ||
                    (av.iconName === 'piano' && (avatar.icon === 'piano' || avatar.icon === '🎹')) ||
                    (av.iconName === 'headphones' && (avatar.icon === 'headphones' || avatar.icon === '🎧')) ||
                    (av.iconName === 'music' && (avatar.icon === 'music' || avatar.icon === '🎼' || avatar.icon === '🎵')) ||
                    (av.iconName === 'guitar' && (avatar.icon === 'guitar' || avatar.icon === '🎸')) ||
                    (av.iconName === 'mic' && (avatar.icon === 'mic' || avatar.icon === '🎙️')) ||
                    (av.iconName === 'disc' && (avatar.icon === 'disc' || avatar.icon === '🥁')) ||
                    (av.iconName === 'sparkles' && (avatar.icon === 'sparkles' || avatar.icon === '✨')) ||
                    (av.iconName === 'zap' && (avatar.icon === 'zap' || avatar.icon === '⚡')) ||
                    (av.iconName === 'radio' && (avatar.icon === 'radio' || avatar.icon === '📻'));

                  return (
                    <Pressable
                      key={av.id}
                      onPress={() => setAvatar({ icon: av.iconName, bgColour: '#161021' })}
                      accessibilityLabel={`Select avatar ${av.label}`}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#FF1E8E]/20 border-[#FF1E8E] text-[#FF1E8E] shadow-[0_0_15px_rgba(255,30,142,0.35)] ring-1 ring-[#FF1E8E]/60 scale-105'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <IconComp className={`w-6 h-6 ${isSelected ? 'text-[#FF1E8E] stroke-[2.2]' : 'text-slate-400'}`} />
                      <Text className={`text-[11px] font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {av.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={() => setStep(2)}
              className="mt-3 py-3.5 rounded-2xl bg-[#FF1E8E] hover:bg-[#ff359c] active:bg-[#e01479] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_20px_rgba(255,30,142,0.35)] transition-all"
            >
              <Text className="text-white font-bold text-sm font-heading">Next: Piano Experience</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Skill Check */}
        {step === 2 && (
          <View className="flex flex-col gap-3.5">
            <Text className="text-slate-300 text-sm leading-relaxed">
              What is your current experience level with the piano?
            </Text>

            <Pressable
              onPress={() => setSkillLevel('never_played')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                skillLevel === 'never_played'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Complete Beginner</Text>
                <Text className="text-xs text-slate-400 mt-0.5">I have never played the piano before</Text>
              </View>
              {skillLevel === 'never_played' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <Pressable
              onPress={() => setSkillLevel('know_some_notes')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                skillLevel === 'know_some_notes'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Know Some Notes</Text>
                <Text className="text-xs text-slate-400 mt-0.5">I know Middle C and a few basic keys</Text>
              </View>
              {skillLevel === 'know_some_notes' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <Pressable
              onPress={() => setSkillLevel('play_simple_songs')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                skillLevel === 'play_simple_songs'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Can Play Simple Melodies</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Looking to master chords and create tracks</Text>
              </View>
              {skillLevel === 'play_simple_songs' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <View className="flex flex-row gap-2.5 mt-3">
              <Pressable
                onPress={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm"
              >
                <Text className="text-slate-300 font-semibold text-sm">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(3)}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF1E8E] hover:bg-[#ff359c] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_20px_rgba(255,30,142,0.35)] transition-all"
              >
                <Text className="text-white font-bold text-sm font-heading">Next: Learning Goals</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 3: Musical Ambition */}
        {step === 3 && (
          <View className="flex flex-col gap-3.5">
            <Text className="text-slate-300 text-sm leading-relaxed">What is your primary musical ambition?</Text>

            <Pressable
              onPress={() => setGoal('both')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                goal === 'both'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Learn &amp; Create Music (Recommended)</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Apply chords learnt in lessons to make beats</Text>
              </View>
              {goal === 'both' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <Pressable
              onPress={() => setGoal('learn_songs')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                goal === 'learn_songs'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Focus on Piano Songs</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Master sheet music and famous melodies</Text>
              </View>
              {goal === 'learn_songs' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <Pressable
              onPress={() => setGoal('make_music')}
              className={`p-4 rounded-2xl border flex flex-row items-center justify-between transition-all ${
                goal === 'make_music'
                  ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 shadow-sm'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <View className="flex flex-col">
                <Text className="font-semibold text-sm text-white">Music Production &amp; Beats</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Synthesizers, drums, basslines, and vocals</Text>
              </View>
              {goal === 'make_music' && <CheckCircle className="w-5 h-5 text-[#FF1E8E]" />}
            </Pressable>

            <View className="flex flex-row gap-2.5 mt-3">
              <Pressable
                onPress={() => setStep(2)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm"
              >
                <Text className="text-slate-300 font-semibold text-sm">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(4)}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF1E8E] hover:bg-[#ff359c] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_20px_rgba(255,30,142,0.35)] transition-all"
              >
                <Text className="text-white font-bold text-sm font-heading">Next: Daily Commitment</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 4: Daily Commitment & XP Goal */}
        {step === 4 && (
          <View className="flex flex-col gap-3.5">
            <Text className="text-slate-300 text-sm leading-relaxed">
              How many minutes a day and target XP for your daily practice ring?
            </Text>

            <View className="grid grid-cols-2 gap-3">
              {[
                { mins: 5, xp: 30, desc: 'Casual Programme' },
                { mins: 10, xp: 60, desc: 'Steady Programme' },
                { mins: 15, xp: 100, desc: 'Serious Programme' },
                { mins: 20, xp: 150, desc: 'Intensive Programme' },
              ].map((item) => (
                <Pressable
                  key={item.mins}
                  onPress={() => {
                    setDailyGoalMinutes(item.mins);
                    setDailyXpTarget(item.xp);
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    dailyGoalMinutes === item.mins
                      ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 shadow-sm'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#FF1E8E]" />
                  <Text className="text-white font-bold text-sm">{item.mins} mins</Text>
                  <Text className="text-[11px] text-[#FF1E8E] font-semibold font-mono">{item.xp} XP / Day</Text>
                  <Text className="text-[10px] text-slate-400">{item.desc}</Text>
                </Pressable>
              ))}
            </View>

            <View className="flex flex-row gap-2.5 mt-3">
              <Pressable
                onPress={() => setStep(3)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm"
              >
                <Text className="text-slate-300 font-semibold text-sm">Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setStep(5)}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF1E8E] hover:bg-[#ff359c] text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_20px_rgba(255,30,142,0.35)] transition-all"
              >
                <Text className="text-white font-bold text-sm font-heading">Next: Hand &amp; Reminder</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Step 5: Dominant Hand & Reminder */}
        {step === 5 && (
          <View className="flex flex-col gap-3.5">
            <Text className="text-slate-300 text-sm leading-relaxed">
              Select your dominant hand and preferred daily practice reminder time:
            </Text>

            <View className="flex flex-row gap-3">
              <Pressable
                onPress={() => setDominantHand('right')}
                className={`flex-1 p-3.5 rounded-2xl border flex flex-row items-center justify-center gap-2 transition-all ${
                  dominantHand === 'right'
                    ? 'bg-[#FF1E8E]/15 border-[#FF1E8E] ring-1 ring-[#FF1E8E]/40 shadow-sm'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <Hand className="w-4 h-4 text-[#FF1E8E]" />
                <Text className="text-white font-semibold text-xs">Right-Handed</Text>
              </Pressable>

              <Pressable
                onPress={() => setDominantHand('left')}
                className={`flex-1 p-3.5 rounded-2xl border flex flex-row items-center justify-center gap-2 transition-all ${
                  dominantHand === 'left'
                    ? 'bg-[#B829FF]/15 border-[#B829FF] ring-1 ring-[#B829FF]/40 shadow-sm'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <Hand className="w-4 h-4 text-[#B829FF]" />
                <Text className="text-white font-semibold text-xs">Left-Handed</Text>
              </Pressable>
            </View>

            <View className="mt-1 flex flex-col gap-1.5">
              <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-heading">
                Daily Practice Reminder
              </Text>
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="18:30"
                className="font-mono"
              />
            </View>

            <View className="flex flex-row gap-2.5 mt-3">
              <Pressable
                onPress={() => setStep(4)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm"
              >
                <Text className="text-slate-300 font-semibold text-sm">Back</Text>
              </Pressable>
              <Pressable
                onPress={handleFinish}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#D946EF] via-[#FF1E8E] to-[#FF0055] hover:opacity-95 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_25px_rgba(255,30,142,0.4)] active:scale-[0.98] transition-all"
              >
                <Text className="text-white font-bold text-sm font-heading">Start Playing &amp; Creating</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
