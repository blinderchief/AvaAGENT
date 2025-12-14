'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dimension = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <Image
          src="/logo.svg"
          alt="AvaAgent Logo"
          width={dimension}
          height={dimension}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={`font-bold text-white ${size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : 'text-lg'}`}>
          Ava<span className="text-avalanche-500">Agent</span>
        </span>
      )}
    </div>
  );
}

// Inline SVG version for places where we can't use Image
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      width={size} 
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="avaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E84142', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FC4F4F', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="100" cy="100" r="95" fill="#0F0F0F" stroke="#1F1F1F" strokeWidth="2"/>
      <circle cx="100" cy="100" r="85" fill="none" stroke="url(#avaxGradient)" strokeWidth="3" opacity="0.6"/>
      <polygon 
        points="100,25 170,145 30,145" 
        fill="none" 
        stroke="url(#avaxGradient)" 
        strokeWidth="4"
        filter="url(#glow)"
      />
      <polygon 
        points="100,50 145,125 55,125" 
        fill="url(#aiGradient)" 
        opacity="0.9"
      />
      <circle cx="100" cy="95" r="15" fill="#0F0F0F"/>
      <circle cx="100" cy="95" r="10" fill="url(#avaxGradient)" filter="url(#glow)"/>
      <circle cx="100" cy="95" r="4" fill="#FFF"/>
      <g stroke="#6366F1" strokeWidth="1.5" opacity="0.7">
        <line x1="100" y1="50" x2="100" y2="80"/>
        <line x1="70" y1="115" x2="90" y2="100"/>
        <line x1="130" y1="115" x2="110" y2="100"/>
      </g>
      <circle cx="70" cy="115" r="4" fill="#6366F1"/>
      <circle cx="130" cy="115" r="4" fill="#6366F1"/>
      <circle cx="100" cy="50" r="4" fill="#E84142"/>
    </svg>
  );
}
