import React from 'react';

interface Props {
  text: string;
}

export default function SubtitleOverlay({ text }: Props) {
  return (
    <div 
      className="absolute bottom-[25%] left-0 w-full text-center z-10 pointer-events-none px-5 transition-transform duration-200"
      style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
      }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}