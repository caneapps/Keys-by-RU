import React from 'react';
import { View } from './native-ui.tsx';

interface LogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  className = '',
  showBackground = true,
  glow = true,
}) => {
  return (
    <View
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none pointer-events-none"
      >
        <defs>
          <linearGradient id="ruNeonGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-secondary)" />
            <stop offset="60%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-primary)" />
          </linearGradient>

          <linearGradient id="ruSquircleBgComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--surface-elevated)" />
            <stop offset="100%" stopColor="#0B0710" />
          </linearGradient>

          {glow && (
            <filter id="ruNeonGlowComp" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.8" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Dark Obsidian Squircle Background with Active Surface Tint */}
        {showBackground && (
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="24"
            fill="url(#ruSquircleBgComp)"
            stroke="var(--brand-primary)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
        )}

        {/* Official 'R Key-Stroke Monogram' */}
        <g
          filter={glow ? 'url(#ruNeonGlowComp)' : undefined}
          fill="none"
          stroke="url(#ruNeonGradComp)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Circular Neon Badge Ring */}
          <circle cx="50" cy="50" r="35" strokeOpacity="0.95" />

          {/* Left Vertical Stem: Framed rectangle enclosing exactly 2 hollow piano keys with single hollow black key notched at top */}
          <rect x="27" y="27" width="19" height="46" rx="2" strokeWidth="2.8" />
          {/* Vertical dividing line between the two white keys */}
          <line x1="36.5" y1="46" x2="36.5" y2="73" strokeWidth="2.2" />
          {/* Single hollow black key notched between them at the top */}
          <rect x="33" y="27" width="7" height="19" rx="1.5" strokeWidth="2.2" />

          {/* Right Side: Sweeps into curved bowl and diagonal leg of letter 'R' */}
          <path d="M 46 27 L 54 27 C 64 27 69 33 69 40 C 69 47 63 52 52 52 L 46 52" strokeWidth="2.8" />
          <path d="M 52 52 C 58 52 62 60 67 73" strokeWidth="2.8" />
        </g>
      </svg>
    </View>
  );
};
