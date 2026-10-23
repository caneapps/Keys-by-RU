import React from 'react';
import { View, Text, Pressable } from './native-ui.tsx';
import { Mic, ShieldCheck, X } from 'lucide-react';

interface MicrophonePermissionModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <View className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <View className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        <View className="flex flex-row items-center justify-between">
          <View className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Mic className="w-5 h-5 text-indigo-400" />
          </View>
          <Pressable
            onPress={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            accessibilityLabel="Close Dialog"
          >
            <X className="w-4 h-4 text-slate-300" />
          </Pressable>
        </View>

        <View className="flex flex-col gap-1">
          <Text className="text-white font-bold text-base">Enable Acoustic Piano Pitch Detection</Text>
          <Text className="text-slate-400 text-xs">
            Practise on your real upright or grand piano at home
          </Text>
        </View>

        <Text className="text-slate-300 text-xs leading-relaxed">
          Keys by Ru uses your iPhone microphone to detect which musical note you play in real time.
        </Text>

        <View className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-row items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <Text className="text-[11px] text-slate-300 leading-normal">
            <Text className="font-bold text-white">Privacy Guarantee: </Text>
            Audio is analysed entirely on your device using Web Audio algorithms. No sound or speech is ever recorded, stored, or sent to any server.
          </Text>
        </View>

        <View className="flex flex-row gap-2 mt-2">
          <Pressable
            onPress={onCancel}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            <Text className="text-slate-300 font-semibold text-xs">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-md"
          >
            <Text className="text-white font-bold text-xs">Grant Microphone Access</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
