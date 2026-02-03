import React, { ChangeEvent } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { FaPlay, FaPause } from 'react-icons/fa6'; // Import icon play & pause

interface Props {
  isPlaying: boolean;
  togglePlay: () => void;
  trackName: string;
  currentTime: number;
  duration: number;
  handleSeek: (e: ChangeEvent<HTMLInputElement>) => void;
  formatTime: (s: number) => string;
}

export default function PlayerControls({ isPlaying, togglePlay, trackName, currentTime, duration, handleSeek, formatTime }: Props) {
  return (
    <div className="w-full flex justify-center items-end pointer-events-auto mb-4 transition-opacity duration-500">
      <GlassPanel className="px-6 py-4 rounded-full flex items-center gap-4 w-full max-w-2xl">
        <button onClick={togglePlay} className="text-white hover:text-cyan-400 text-xl w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition flex-shrink-0">
          {/* Logika Toggle Icon */}
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-end mb-1 px-1">
            <span className="text-xs text-gray-300 truncate font-mono max-w-[200px]">{trackName}</span>
            <span className="text-xs text-cyan-400 font-mono tracking-wider">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100"
            step="0.1"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </GlassPanel>
    </div>
  );
}