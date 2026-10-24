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
    <View className="fixed inset-0 z-50 bg-[#0B0710]/85 backdrop-blur-md flex items-center justify-center p-4">
      <View
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-fade-in"
        style={{
          backgroundColor: '#161021',
          border: '1px solid rgba(var(--brand-primary-rgb, 255, 30, 142), 0.35)',
          boxShadow: 'var(--brand-glow)',
        }}
      >
        <View className="flex flex-row items-center justify-between">
          <View
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(var(--brand-primary-rgb, 255, 30, 142), 0.15)',
              border: '1px solid var(--brand-primary)',
            }}
          >
            <Mic className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
          </View>
          <Pressable
            onPress={onCancel}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
            accessibilityLabel="Close Dialog"
          >
            <X className="w-4 h-4 text-slate-300" />
          </Pressable>
        </View>

        <View className="flex flex-col gap-1">
          <Text className="text-white font-bold text-base font-heading">
            Enable Acoustic Piano Pitch Detection
          </Text>
          <Text className="text-slate-400 text-xs">
            Practise on your real upright or grand piano at home
          </Text>
        </View>

        <Text className="text-slate-300 text-xs leading-relaxed">
          Keys by Ru listens via your iPhone microphone, detects notes in real time using Web Audio autocorrelation, and provides instant visual feedback on the grand staff.
        </Text>

        <View className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-row items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <Text className="text-[11px] text-slate-300 leading-normal">
            <Text className="font-bold text-white">Privacy Guarantee: </Text>
            Audio is analysed strictly in real time on your device. Zero audio or speech is ever recorded, stored, or sent across any network.
          </Text>
        </View>

        <View className="flex flex-row gap-2 mt-2">
          <Pressable
            onPress={onCancel}
            className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10"
          >
            <Text className="text-slate-300 font-semibold text-xs">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            className="flex-1 py-3 rounded-2xl flex items-center justify-center font-bold text-xs shadow-md transition-all"
            style={{
              backgroundColor: 'var(--brand-primary)',
              boxShadow: 'var(--brand-glow)',
            }}
          >
            <Text className="text-black font-bold text-xs">Enable Microphone Access</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
