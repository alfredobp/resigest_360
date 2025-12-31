import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ width = 231, height = 99, className = "" }: LogoProps) {
  return (
   
<svg width ={width} height={height} viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">

<defs>
    <style>{`
      .verde { fill: #4CAF50; }
      .azul { fill: #007399; }
      .texto-verde { fill: #66A33D; font-family: Arial, sans-serif; font-weight: bold; }
      .texto-azul { fill: #007399; font-family: Arial, sans-serif; font-weight: bold; }
    `}</style>
  </defs>

  <g id="logo-icon">
    <path className="verde" d="M80,50 Q110,30 140,50 L145,35 L160,60 L130,65 L135,55 Q110,40 85,55 Z" />
    
    <rect className="verde" x="100" y="85" width="15" height="40" />
    <rect className="verde" x="120" y="95" width="20" height="30" />
    <path className="verde" d="M145,125 L145,80 L165,80 L165,125 Z" />
    <path className="verde" d="M150,75 L160,75 L158,65 Q155,60 152,65 Z" />
    
    <path className="azul" d="M70,120 Q100,160 150,140 Q130,170 80,160 L85,175 L60,165 L75,145 L78,155 Q110,160 130,145 Q90,155 70,120 Z" />
    <path className="azul" d="M90,135 Q115,125 140,135" fill="none" stroke="#007399" strokeWidth="3" />
    <path className="azul" d="M95,145 Q115,135 135,145" fill="none" stroke="#007399" strokeWidth="3" />
  </g>

  <text x="180" y="125" fontSize="52">
    <tspan className="texto-verde">ResiGest</tspan>
    <tspan className="texto-azul">360</tspan>
  </text>
</svg>
  );
}
