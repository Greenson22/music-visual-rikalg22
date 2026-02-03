import React, { ChangeEvent } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { FaMusic } from 'react-icons/fa6'; // Import icon music

interface Props {
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadPrompt({ onFileUpload }: Props) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto transition-opacity duration-500">
      <label className="cursor-pointer group">
        <GlassPanel className="p-10 rounded-3xl flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 border-dashed border-2 border-gray-600 hover:border-cyan-400">
          {/* Icon Music */}
          <FaMusic className="text-5xl mb-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          <h2 className="text-2xl font-bold mb-2">Pilih Lagu</h2>
          <p className="text-sm text-gray-400">Klik untuk upload MP3 atau WAV</p>
        </GlassPanel>
        <input type="file" onChange={onFileUpload} accept="audio/*" className="hidden" />
      </label>
    </div>
  );
}