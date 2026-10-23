import React from 'react';
import { View, Text } from './native-ui.tsx';
import { AvatarConfig } from '../types/index.ts';
import {
  Piano,
  Headphones,
  Music,
  Guitar,
  Mic,
  Disc,
  Sparkles,
  Zap,
  Radio,
  LucideIcon,
} from 'lucide-react';

export const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  piano: Piano,
  '🎹': Piano,
  headphones: Headphones,
  '🎧': Headphones,
  music: Music,
  '🎼': Music,
  '🎵': Music,
  guitar: Guitar,
  '🎸': Guitar,
  mic: Mic,
  '🎙️': Mic,
  '🎤': Mic,
  disc: Disc,
  '🥁': Disc,
  sparkles: Sparkles,
  '✨': Sparkles,
  '🌟': Sparkles,
  zap: Zap,
  '⚡': Zap,
  radio: Radio,
  '📻': Radio,
};

export interface AvatarOption {
  id: string;
  label: string;
  iconName: string;
}

export const MONOCHROME_AVATAR_OPTIONS: AvatarOption[] = [
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

interface AvatarDisplayProps {
  avatar?: AvatarConfig | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  iconClassName?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 'md',
  className = '',
  iconClassName = '',
}) => {
  const iconKey = typeof avatar === 'string' ? avatar : avatar?.icon || 'piano';
  const IconComponent: LucideIcon = AVATAR_ICON_MAP[iconKey] || Piano;

  const sizeClasses: Record<string, { container: string; icon: string }> = {
    xs: { container: 'w-6 h-6 rounded-lg', icon: 'w-3.5 h-3.5' },
    sm: { container: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
    xl: { container: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <View
      className={`${selectedSize.container} flex items-center justify-center shrink-0 ${className}`}
    >
      <IconComponent className={`${selectedSize.icon} ${iconClassName}`} />
    </View>
  );
};
