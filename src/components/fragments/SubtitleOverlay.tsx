// src/components/fragments/SubtitleOverlay.tsx
import React, { useMemo } from 'react';
import { Subtitle } from '@/types';

interface Props {
  currentSubtitle: Subtitle | null;
  currentTime: number;
}

export default function SubtitleOverlay({ currentSubtitle, currentTime }: Props) {
  
  if (!currentSubtitle) return null;

  const { start, end, text, words } = currentSubtitle;
  
  // Logic render
  const renderWords = () => {
      // KASUS 1: Data Kata tersedia (Hasil Sync Tool Per Kata)
      if (words && words.length > 0) {
          return words.map((word, index) => {
             // Cek apakah waktu sekarang berada di range kata ini
             // ATAU sudah melewati kata ini (supaya tetap menyala hijau/cyan jika sudah lewat di baris yang sama)
             const isActive = currentTime >= word.start;
             const isCurrent = currentTime >= word.start && currentTime < word.end;
             
             // Jika belum mulai, warnanya abu. Jika sudah lewat, warnanya tetap terang (atau redup sedikit).
             // Style Karaoke: Kata yg sudah lewat = Fill color. Kata yg belum = Outline/Gray.
             
             return (
                <span 
                  key={index}
                  className={`inline-block mx-1 transition-all duration-75 transform origin-bottom
                    ${isActive ? 'text-cyan-400' : 'text-gray-600'}
                    ${isCurrent ? 'scale-125 shadow-glow text-white' : ''}
                  `}
                  style={{
                      textShadow: isActive ? '0 0 15px rgba(34, 211, 238, 0.5)' : 'none',
                      // Sedikit efek spring
                      transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  {word.text}
                </span>
             );
          });
      }

      // KASUS 2: Tidak ada data kata (Upload SRT biasa) -> Interpolasi Otomatis (Estimasi)
      const estimatedWords = text.split(' ');
      const duration = end - start;
      const progress = Math.max(0, Math.min(1, (currentTime - start) / duration));
      const activeIndex = Math.floor(progress * estimatedWords.length);

      return estimatedWords.map((word, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <span 
              key={index}
              className={`inline-block mx-1 transition-all duration-300
                ${isActive ? 'text-cyan-400' : 'text-gray-600'}
                ${isCurrent ? 'scale-110' : ''}
              `}
            >
              {word}
            </span>
          );
      });
  };

  return (
    <div className="absolute bottom-[20%] left-0 w-full flex flex-col items-center justify-center z-10 pointer-events-none px-8">
      <div 
        className="text-center max-w-5xl flex flex-wrap justify-center gap-y-2 leading-relaxed"
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 3rem)',
          fontWeight: 800,
          textShadow: '0 4px 8px rgba(0,0,0,0.8)'
        }}
      >
        {renderWords()}
      </div>
    </div>
  );
}