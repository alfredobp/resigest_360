import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ width = 231, height = 99, className = "" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 180"
      width={width}
      height={height}
      className={className}
    >
      {/* Globo */}
      <defs>
        <radialGradient id="ocean" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#6ec6ff"/>
          <stop offset="100%" stopColor="#0b4f6c"/>
        </radialGradient>

        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9be15d"/>
          <stop offset="100%" stopColor="#2ecc71"/>
        </linearGradient>
      </defs>

      <g transform="translate(90 90)">
        <circle r="55" fill="url(#ocean)" />

        {/* Continentes simplificados */}
        <path
          d="M-30 -10 C-40 -30 -10 -45 5 -35 C15 -25 0 -15 -10 -5 C-20 5 -15 20 -5 25 C10 35 -20 45 -30 20 Z"
          fill="url(#land)"
          opacity="0.9"
        />
        <path
          d="M20 -15 C35 -25 45 -5 30 5 C20 12 25 25 15 30 C5 35 -5 20 5 10 C15 0 10 -10 20 -15 Z"
          fill="url(#land)"
          opacity="0.9"
        />

        {/* Pin */}
        <g transform="translate(15 -10)">
          <path
            d="M0 -18 C-10 -18 -18 -10 -18 0 C-18 14 0 30 0 30 C0 30 18 14 18 0 C18 -10 10 -18 0 -18 Z"
            fill="#e53935"
          />
          <circle cx="0" cy="-4" r="5" fill="#ffffff"/>
        </g>
      </g>

      {/* Texto */}
      <text
        x="170"
        y="105"
        fontSize="48"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
      >
        <tspan fill="#0b4f6c">Map</tspan>
        <tspan fill="#2ecc71">Sig</tspan>
      </text>
    </svg>
  );
}
