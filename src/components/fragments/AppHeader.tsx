import React from 'react';
import GlassPanel from '../elements/GlassPanel';
import IconButton from '../elements/IconButton';
// Update import icon: Ganti FaWaveSquare dengan FaCompactDisc (atau FaHeadphonesSimple)
import { FaClosedCaptioning, FaMicrophone, FaExpand, FaFolderOpen, FaCompactDisc } from 'react-icons/fa6';

interface Props {
  statusText: string;
  onOpenModal: () => void;
  onMicMode: () => void;
  onOpenLibrary?: () => void; // Prop dari fitur File Manager sebelumnya
}

export default function AppHeader({ statusText, onOpenModal, onMicMode, onOpenLibrary }: Props) {
  return (
    <div className="w-full flex justify-between items-start pointer-events-auto">
      <GlassPanel className="px-6 py-3 rounded-2xl">
        <h1 className="text-xl font-light tracking-widest uppercase text-gray-200 flex items-center">
          {/* Ganti Icon & Nama */}
          <FaCompactDisc className="mr-3 text-cyan-400 text-2xl" />
          F. R. <span className="font-bold text-white ml-2">Gerung</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">{statusText}</p>
      </GlassPanel>
      
      <div className="flex gap-3">
        {/* Tombol Library (Jika tersedia) */}
        {onOpenLibrary && (
             <IconButton icon={<FaFolderOpen />} onClick={onOpenLibrary} title="Buka Library Folder" className="text-amber-400 hover:text-amber-300" />
        )}
        <IconButton icon={<FaClosedCaptioning />} onClick={onOpenModal} title="Editor Subtitle" />
        <IconButton icon={<FaMicrophone />} onClick={onMicMode} title="Gunakan Mikrofon" />
        <IconButton icon={<FaExpand />} onClick={() => document.documentElement.requestFullscreen()} title="Layar Penuh" />
      </div>
    </div>
  );
}