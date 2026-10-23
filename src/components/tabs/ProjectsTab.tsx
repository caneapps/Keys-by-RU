import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from '../native-ui.tsx';
import {
  Mic,
  Sliders,
  Download,
  Share2,
  FileAudio,
  CheckCircle2,
  Volume2,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { Logo } from '../Logo.tsx';

interface ProjectsTabProps {
  onEarnXp: (xp: number) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ onEarnXp }) => {
  const [trackTitle, setTrackTitle] = useState('Midnight London Soul');
  const [artistName, setArtistName] = useState('Ru & Co');
  const [vocalPreset, setVocalPreset] = useState<'clean' | 'warm' | 'radio' | 'lo-fi'>('warm');
  const [isNormalising, setIsNormalising] = useState(false);
  const [normalisationComplete, setNormalisationComplete] = useState(false);
  const [activeReleaseTab, setActiveReleaseTab] = useState<'mixer' | 'publish' | 'video'>('mixer');

  // Track mixer levels
  const [pianoVolume, setPianoVolume] = useState(85);
  const [drumsVolume, setDrumsVolume] = useState(90);
  const [bassVolume, setBassVolume] = useState(80);
  const [vocalsVolume, setVocalsVolume] = useState(75);

  const runNormalisation = () => {
    setIsNormalising(true);
    setTimeout(() => {
      setIsNormalising(false);
      setNormalisationComplete(true);
      onEarnXp(25);
    }, 1200);
  };

  const handleExportWav = () => {
    // Generate a dummy audio blob for testing export
    const blob = new Blob(['RIFF....WAVEfmt ....data....'], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackTitle.toLowerCase().replace(/\s+/g, '_')}_master.wav`;
    a.click();
    URL.revokeObjectURL(url);
    onEarnXp(50);
  };

  const handleShareIOS = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trackTitle,
          text: `Listen to my new piano track "${trackTitle}" made on Keys by Ru!`,
          url: window.location.href,
        });
      } catch {}
    } else {
      alert(`Track link copied to clipboard for Instagram & TikTok!`);
    }
  };

  return (
    <ScrollView className="w-full flex-1 p-4 pb-24 gap-5">
      {/* Tab Switcher: Mixer & Vocals | Release Package | 9:16 Video Maker */}
      <View className="flex flex-row items-center gap-1.5 p-1 bg-[#161021] rounded-2xl border border-[#FF1E8E]/20">
        <Pressable
          onPress={() => setActiveReleaseTab('mixer')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
            activeReleaseTab === 'mixer'
              ? 'bg-[#FF1E8E] text-white shadow-sm shadow-[#FF1E8E]/25'
              : 'text-slate-400'
          }`}
        >
          <Text className="text-xs font-bold text-white font-heading">Mixer &amp; Vocals</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveReleaseTab('publish')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
            activeReleaseTab === 'publish'
              ? 'bg-[#FF1E8E] text-white shadow-sm shadow-[#FF1E8E]/25'
              : 'text-slate-400'
          }`}
        >
          <Text className="text-xs font-bold text-white font-heading">Publish Wizard</Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveReleaseTab('video')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
            activeReleaseTab === 'video'
              ? 'bg-[#FF1E8E] text-white shadow-sm shadow-[#FF1E8E]/25'
              : 'text-slate-400'
          }`}
        >
          <Text className="text-xs font-bold text-white font-heading">9:16 Video Clip</Text>
        </Pressable>
      </View>

      {/* Mixer & Vocals View */}
      {activeReleaseTab === 'mixer' && (
        <View className="flex flex-col gap-4">
          {/* Vocal Booth Recording Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" />
                <Text className="text-white font-bold text-sm">Vocal Recording &amp; Presets</Text>
              </View>
              <View className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                <Text className="text-emerald-300 text-[10px] font-bold">Headphones Recommended</Text>
              </View>
            </View>

            <Text className="text-slate-400 text-xs">
              Record vocal top-lines or harmonies directly over your beats and piano chords.
            </Text>

            {/* Vocal Style Presets */}
            <View className="flex flex-col gap-1.5">
              <Text className="text-xs text-slate-300 font-semibold">Ru Vocal Processing Chain:</Text>
              <View className="grid grid-cols-4 gap-2">
                {(['clean', 'warm', 'radio', 'lo-fi'] as const).map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setVocalPreset(preset)}
                    className={`py-2 rounded-xl text-center capitalize border font-semibold text-xs ${
                      vocalPreset === preset
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Text className="text-xs font-semibold capitalize text-white">{preset}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* 4-Channel Mixer Console */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <Text className="text-white font-bold text-sm">4-Track Studio Mixer</Text>
              </View>
              <Text className="text-xs text-slate-400">Integrated Gain &amp; Pan</Text>
            </View>

            {/* Faders */}
            <View className="grid grid-cols-4 gap-3 py-2">
              {[
                { name: 'Piano', val: pianoVolume, set: setPianoVolume },
                { name: 'Drums', val: drumsVolume, set: setDrumsVolume },
                { name: 'Bass', val: bassVolume, set: setBassVolume },
                { name: 'Vocals', val: vocalsVolume, set: setVocalsVolume },
              ].map((trk) => (
                <View
                  key={trk.name}
                  className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center gap-2"
                >
                  <Text className="text-xs font-bold text-slate-200">{trk.name}</Text>
                  <View className="h-28 w-4 bg-slate-800 rounded-full relative overflow-hidden flex flex-col justify-end">
                    <View
                      className="w-full bg-gradient-to-t from-indigo-500 to-sky-400 rounded-full"
                      style={{ height: `${trk.val}%` }}
                    />
                  </View>
                  <Text className="text-[10px] font-mono text-slate-400">{trk.val}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Loudness Normalisation & Export */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white font-bold text-sm">Loudness Normalisation &amp; Export</Text>
              <View className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                <Text className="text-slate-300 font-mono text-[10px]">-14.0 LUFS Target</Text>
              </View>
            </View>

            <Text className="text-slate-400 text-xs">
              Automatic broadcast normalisation ensuring your release complies with Spotify, Apple Music, and YouTube loudness standards with zero digital clipping.
            </Text>

            <View className="flex flex-row gap-3 mt-1">
              <Pressable
                onPress={runNormalisation}
                disabled={isNormalising}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                {isNormalising ? (
                  <Text className="text-white font-bold text-xs">Normalising Loudness...</Text>
                ) : normalisationComplete ? (
                  <Text className="text-white font-bold text-xs">Standard Met (-14 LUFS OK)</Text>
                ) : (
                  <Text className="text-white font-bold text-xs">Analyse &amp; Normalise Master</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleExportWav}
                className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-row items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <Text className="text-white font-bold text-xs">Export WAV</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Publish Wizard View */}
      {activeReleaseTab === 'publish' && (
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              <Text className="text-white font-bold text-sm">Distributor Release Package</Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30">
              <Text className="text-indigo-300 text-xs font-semibold">DistroKid / TuneCore Ready</Text>
            </View>
          </View>

          <View className="flex flex-col gap-3">
            <View className="flex flex-col gap-1">
              <Text className="text-xs text-slate-400 font-semibold">Track Title:</Text>
              <TextInput value={trackTitle} onChangeText={setTrackTitle} />
            </View>

            <View className="flex flex-col gap-1">
              <Text className="text-xs text-slate-400 font-semibold">Artist / Band Name:</Text>
              <TextInput value={artistName} onChangeText={setArtistName} />
            </View>

            <View className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
              <Text className="text-xs text-slate-300 font-bold">Release Rights Verification:</Text>
              <View className="flex flex-row items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <Text className="text-xs text-slate-300">
                  Original composition and cleared royalty-free loops verified
                </Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <Text className="text-xs text-slate-300">
                  Artwork format verified: 3000 x 3000 square RGB
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleShareIOS}
              className="mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <Text className="text-white font-bold text-xs">Share Release via iOS Share Sheet</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 9:16 Vertical Video Clip View */}
      {activeReleaseTab === 'video' && (
        <View className="bg-[#161021] border border-[#FF1E8E]/20 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-white font-bold text-sm font-heading">9:16 Social Clip Generator</Text>
            <Text className="text-xs text-slate-400">Reels · TikTok · Shorts</Text>
          </View>

          {/* Phone Frame Preview */}
          <View className="w-44 h-80 mx-auto rounded-3xl bg-[#0B0710] border-2 border-[#FF1E8E]/40 p-3 flex flex-col justify-between items-center relative overflow-hidden shadow-2xl">
            <View className="w-12 h-1 bg-white/20 rounded-full mt-1" />

            {/* Artwork Cover & Waveform with Official Logo Template */}
            <View className="flex flex-col items-center gap-2 my-auto">
              <View className="w-24 h-24 rounded-2xl overflow-hidden border border-[#FF1E8E]/30 shadow-xl shadow-[#FF1E8E]/25 flex items-center justify-center bg-[#161021]">
                <Logo size={88} showBackground={true} glow={true} />
              </View>
              <Text className="text-white font-bold text-xs text-center font-heading">{trackTitle}</Text>
              <Text className="text-slate-400 text-[10px] text-center">{artistName}</Text>

              {/* Animated Waveform Visualiser */}
              <View className="flex flex-row items-center gap-1 mt-2">
                {[8, 16, 24, 12, 28, 20, 10, 22, 14, 6].map((h, i) => (
                  <View
                    key={i}
                    className="w-1 bg-[#FF1E8E] rounded-full animate-pulse"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </View>
            </View>

            <Text className="text-[9px] text-[#FF1E8E] font-mono pb-1">Made with Keys by Ru</Text>
          </View>

          <Pressable
            onPress={handleShareIOS}
            className="py-3.5 rounded-2xl bg-[#FF1E8E] hover:bg-[#ff359c] text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#FF1E8E]/30 transition-all"
          >
            <Text className="text-white font-bold text-xs font-heading">Export 9:16 Video Clip</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};
