// src/components/fragments/SubtitleOverlay.tsx
import React, { useMemo } from 'react';
import { Subtitle } from '@/types';

interface Props {
  currentSubtitle: Subtitle | null; // Menerima object subtitle lengkap
  currentTime: number;              // Menerima waktu audio saat ini
}

export default function SubtitleOverlay({ currentSubtitle, currentTime }: Props) {
  
  // Memecah kalimat menjadi array kata-kata
  const words = useMemo(() => {
    if (!currentSubtitle) return [];
    return currentSubtitle.text.split(' ');
  }, [currentSubtitle]);

  if (!currentSubtitle) return null;

  const { start, end } = currentSubtitle;
  const duration = end - start;
  
  // Hitung progress baris saat ini (0.0 sampai 1.0)
  const progress = Math.max(0, Math.min(1, (currentTime - start) / duration));

  // Hitung indeks kata yang harus aktif berdasarkan progress
  // Contoh: Jika progress 50% dan ada 4 kata, maka aktif di kata ke-2
  const activeIndex = Math.floor(progress * words.length);

  return (
    <div className="absolute bottom-[20%] left-0 w-full flex flex-col items-center justify-center z-10 pointer-events-none px-8 transition-all duration-300">
      <div 
        className="text-center max-w-4xl flex flex-wrap justify-center gap-x-3 gap-y-1"
        style={{
          textShadow: '0 4px 12px rgba(0,0,0,0.8)'
        }}
      >
        {words.map((word, index) => {
          // Logika pewarnaan
          const isActive = index <= activeIndex;
          const isCurrentWord = index === activeIndex;

          return (
            <span 
              key={index}
              className={`text-3xl md:text-5xl font-bold transition-all duration-200 ease-out transform
                ${isActive ? 'text-cyan-400 scale-105' : 'text-gray-500/60 scale-100'}
                ${isCurrentWord ? 'scale-110 shadow-glow' : ''}
              `}
              style={{
                 // Efek glow manual jika class tailwind tidak cukup
                 textShadow: isActive 
                    ? '0 0 20px rgba(34, 211, 238, 0.6), 0 0 10px rgba(34, 211, 238, 0.8)' 
                    : 'none',
                 // Sedikit delay per kata agar smooth
                 transitionDelay: `${index * 0.05}s` // Opsional: Hapus jika ingin respons instan
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      
      {/* Progress Bar Tipis di bawah lirik (Opsional - Estetik Player Modern) */}
      {/* <div className="mt-4 w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
            className="h-full bg-cyan-400 transition-all duration-100 ease-linear" 
            style={{ width: `${progress * 100}%` }}
        />
      </div> */}
    </div>
  );
}