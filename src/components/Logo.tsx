import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#1a1a1a', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#2d2d2d', stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#FFA500', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#FF8C00', stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="encryptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#00BFFF', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#1E90FF', stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Main background circle */}
          <circle 
            cx="32" 
            cy="32" 
            r="30" 
            fill="url(#bgGradient)" 
            stroke="url(#goldGradient)" 
            strokeWidth="2"
          />
          
          {/* Inner encryption rings */}
          <circle 
            cx="32" 
            cy="32" 
            r="24" 
            fill="none" 
            stroke="url(#encryptGradient)" 
            strokeWidth="1.5" 
            opacity="0.7"
          />
          <circle 
            cx="32" 
            cy="32" 
            r="18" 
            fill="none" 
            stroke="url(#encryptGradient)" 
            strokeWidth="1" 
            opacity="0.5"
          />
          <circle 
            cx="32" 
            cy="32" 
            r="12" 
            fill="none" 
            stroke="url(#encryptGradient)" 
            strokeWidth="0.8" 
            opacity="0.3"
          />
          
          {/* Central lottery ball */}
          <circle cx="32" cy="32" r="8" fill="url(#goldGradient)"/>
          
          {/* Encryption symbols around the ball */}
          <g opacity="0.8">
            {/* Top encryption symbol */}
            <path d="M32 20 L30 24 L34 24 Z" fill="url(#encryptGradient)"/>
            {/* Right encryption symbol */}
            <path d="M44 32 L40 30 L40 34 Z" fill="url(#encryptGradient)"/>
            {/* Bottom encryption symbol */}
            <path d="M32 44 L30 40 L34 40 Z" fill="url(#encryptGradient)"/>
            {/* Left encryption symbol */}
            <path d="M20 32 L24 30 L24 34 Z" fill="url(#encryptGradient)"/>
          </g>
          
          {/* Diagonal encryption lines */}
          <g opacity="0.6">
            <path d="M16 16 L20 20" stroke="url(#encryptGradient)" strokeWidth="1.5"/>
            <path d="M48 16 L44 20" stroke="url(#encryptGradient)" strokeWidth="1.5"/>
            <path d="M16 48 L20 44" stroke="url(#encryptGradient)" strokeWidth="1.5"/>
            <path d="M48 48 L44 44" stroke="url(#encryptGradient)" strokeWidth="1.5"/>
          </g>
          
          {/* Central number "7" (lucky number) */}
          <text 
            x="32" 
            y="38" 
            fontFamily="Arial, sans-serif" 
            fontSize="12" 
            fontWeight="bold" 
            textAnchor="middle" 
            fill="#1a1a1a"
          >
            7
          </text>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-casino-gold to-casino-red bg-clip-text text-transparent ${textSizeClasses[size]}`}>
            Secret Spin
          </span>
          <span className={`text-xs text-muted-foreground font-medium ${size === 'sm' ? 'hidden' : ''}`}>
            Privacy Vault
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
