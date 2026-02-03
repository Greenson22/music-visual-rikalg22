import React, { ChangeEvent } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { FaMusic, FaFolderOpen } from 'react-icons/fa6';

interface Props {
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onTriggerFolder: () => void; // Diganti dari onFolderUpload
}

export default function UploadPrompt({ onFileUpload, onTriggerFolder }: Props) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto transition-opacity duration-500 w-full max-w-2xl px-4">
      <h2 className="text-3xl font-light tracking-widest uppercase text-white mb-8 drop-shadow-lg">
        Select <span className="font-bold text-cyan-400">Audio</span> Source
      </h2>
      
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {/* Tombol File Single */}
        <label className="cursor-pointer group flex-1">
          <GlassPanel className="h-48 p-6 rounded-3xl flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 border-dashed border-2 border-gray-600 hover:border-cyan-400 bg-black/20">
            <FaMusic className="text-4xl mb-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            <h3 className="text-xl font-bold mb-1">Pilih File</h3>
            <p className="text-xs text-gray-400">Upload satu lagu MP3/WAV</p>
          </GlassPanel>
          <input type="file" onChange={onFileUpload} accept="audio/*" className="hidden" />
        </label>

        {/* Tombol Folder (Sekarang trigger fungsi parent) */}
        <button onClick={onTriggerFolder} className="group flex-1 focus:outline-none text-left">
          <GlassPanel className="h-48 p-6 rounded-3xl flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 border-dashed border-2 border-gray-600 hover:border-amber-400 bg-black/20">
            <FaFolderOpen className="text-4xl mb-4 text-gray-400 group-hover:text-amber-400 transition-colors" />
            <h3 className="text-xl font-bold mb-1">Pilih Folder</h3>
            <p className="text-xs text-gray-400">Scan seluruh folder & subfolder</p>
          </GlassPanel>
        </button>
      </div>
    </div>
  );
}