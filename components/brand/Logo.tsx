import React from 'react';

export function Logo({ size = 24, accentColor = '#1E3A2E' }: { size?: number; accentColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z" 
        fill={accentColor}
      />
      <path 
        d="M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z" 
        fill={accentColor}
        fillOpacity="0.55"
      />
    </svg>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-[7px] bg-text-primary"
        style={{ width: size, height: size }}
      >
        {/* Logo clair sur fond sombre — contraste conforme */}
        <Logo size={size * 0.65} accentColor="#F7F2E8" />
      </div>
      <span className="font-serif text-[17px] tracking-[-0.02em] text-text-primary">
        Safe
      </span>
    </div>
  );
}
