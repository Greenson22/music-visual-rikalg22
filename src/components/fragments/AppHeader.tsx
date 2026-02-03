import React from 'react';
import GlassPanel from '../elements/GlassPanel';
import IconButton from '../elements/IconButton';
// Import icon yang dibutuhkan
import { FaClosedCaptioning, FaMicrophone, FaExpand, FaWaveSquare } from 'react-icons/fa6';

interface Props {
  statusText: string;
  onOpenModal: () => void;
  onMicMode: () => void;
}

export default function AppHeader({ statusText, onOpenModal, onMicMode }: Props) {
  return (
    <div className="w-full flex justify-between items-start pointer-events-auto">
      <GlassPanel className="px-6 py-3 rounded-2xl">
        <h1 className="text-xl font-light tracking-widest uppercase text-gray-200 flex items-center">
          {/* Icon Logo */}
          <FaWaveSquare className="mr-2 text-cyan-400" />
          Sonic<span className="font-bold text-white">Bloom</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">{statusText}</p>
      </GlassPanel>
      
      <div className="flex gap-3">
        {/* Mengirim komponen icon sebagai props */}
        <IconButton icon={<FaClosedCaptioning />} onClick={onOpenModal} title="Editor Subtitle" />
        <IconButton icon={<FaMicrophone />} onClick={onMicMode} title="Gunakan Mikrofon" />
        <IconButton icon={<FaExpand />} onClick={() => document.documentElement.requestFullscreen()} title="Layar Penuh" />
      </div>
    </div>
  );
}