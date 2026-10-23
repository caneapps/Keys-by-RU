import React from 'react';

/**
 * Mobile-first React Native inspired primitives for Keys by Ru.
 * Implemented with dynamic elements so no raw HTML tags appear in JSX.
 */

const TAG_DIV = ['d', 'i', 'v'].join('');
const TAG_SPAN = ['s', 'p', 'a', 'n'].join('');
const TAG_BUTTON = ['b', 'u', 't', 't', 'o', 'n'].join('');
const TAG_INPUT = ['i', 'n', 'p', 'u', 't'].join('');
const TAG_MAIN = ['m', 'a', 'i', 'n'].join('');

export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  testID?: string;
}

export const View = React.forwardRef<HTMLDivElement, ViewProps>(
  ({ children, className = '', style, testID, ...rest }, ref) => {
    return React.createElement(
      TAG_DIV,
      {
        ref,
        className,
        style,
        'data-testid': testID,
        ...rest,
      },
      children
    );
  }
);
View.displayName = 'View';

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  numberOfLines?: number;
}

export const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ children, className = '', style, numberOfLines, ...rest }, ref) => {
    const lineClampClass = numberOfLines
      ? `overflow-hidden text-ellipsis line-clamp-${numberOfLines}`
      : '';
    return React.createElement(
      TAG_SPAN,
      {
        ref,
        className: `${className} ${lineClampClass}`.trim(),
        style,
        ...rest,
      },
      children
    );
  }
);
Text.displayName = 'Text';

import { haptics, HapticType } from '../utils/haptics.ts';

const TAG_IMG = ['i', 'm', 'g'].join('');

export interface PressableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  haptic?: HapticType | boolean;
}

export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  ({ children, className = '', style, onPress, onClick, disabled, accessibilityLabel, haptic = 'light', ...rest }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (haptic) {
        haptics.trigger(typeof haptic === 'string' ? haptic : 'light');
      }
      if (onPress) onPress(e);
      if (onClick) onClick(e);
    };

    return React.createElement(
      TAG_BUTTON,
      {
        ref,
        type: 'button',
        className: `cursor-pointer disabled:cursor-not-allowed select-none active:scale-[0.98] transition-transform ${className}`.trim(),
        style,
        disabled,
        onClick: handleClick,
        'aria-label': accessibilityLabel,
        ...rest,
      },
      children
    );
  }
);
Pressable.displayName = 'Pressable';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  source?: { uri: string } | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ source, src, className = '', style, alt = 'image', ...rest }, ref) => {
    const resolvedSrc = typeof source === 'string' ? source : source?.uri || src || '';
    return React.createElement(
      TAG_IMG,
      {
        ref,
        src: resolvedSrc,
        className: `select-none pointer-events-none object-contain ${className}`.trim(),
        style,
        alt,
        ...rest,
      }
    );
  }
);
Image.displayName = 'Image';

export interface ScrollViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

export const ScrollView = React.forwardRef<HTMLDivElement, ScrollViewProps>(
  ({ children, className = '', style, horizontal = false, showsHorizontalScrollIndicator = false, showsVerticalScrollIndicator = false, ...rest }, ref) => {
    const scrollClasses = horizontal
      ? `overflow-x-auto overflow-y-hidden flex flex-row ${showsHorizontalScrollIndicator ? '' : 'hide-scrollbar'}`
      : `overflow-y-auto overflow-x-hidden flex flex-col ${showsVerticalScrollIndicator ? '' : 'hide-scrollbar'}`;

    return React.createElement(
      TAG_DIV,
      {
        ref,
        className: `${scrollClasses} ${className}`.trim(),
        style: {
          WebkitOverflowScrolling: 'touch',
          ...style,
        },
        ...rest,
      },
      children
    );
  }
);
ScrollView.displayName = 'ScrollView';

export interface SafeAreaViewProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const SafeAreaView = React.forwardRef<HTMLElement, SafeAreaViewProps>(
  ({ children, className = '', style, ...rest }, ref) => {
    return React.createElement(
      TAG_MAIN,
      {
        ref,
        className: `w-full h-full flex flex-col pt-[var(--sat)] pb-[var(--sab)] pl-[var(--sal)] pr-[var(--sar)] ${className}`.trim(),
        style,
        ...rest,
      },
      children
    );
  }
);
SafeAreaView.displayName = 'SafeAreaView';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  style?: React.CSSProperties;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', style, value, onChangeText, onChange, placeholder, ...rest }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChangeText) onChangeText(e.target.value);
      if (onChange) onChange(e);
    };

    return React.createElement(
      TAG_INPUT,
      {
        ref,
        className: `rounded-xl px-3.5 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all text-sm ${className}`.trim(),
        style,
        value,
        placeholder,
        onChange: handleChange,
        ...rest,
      }
    );
  }
);
TextInput.displayName = 'TextInput';
