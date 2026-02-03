import React from 'react';
import GlassPanel from './GlassPanel';

interface IconButtonProps {
  icon: React.ReactNode; // Tipe diubah untuk menerima komponen
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function IconButton({ icon, onClick, title, className = '' }: IconButtonProps) {
  return (
    <button onClick={onClick} title={title} className="focus:outline-none">
      <GlassPanel className={`w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-cyan-400 transition-colors ${className}`}>
        {/* Wrapper div untuk memastikan ukuran icon konsisten */}
        <div className="text-xl">
          {icon}
        </div>
      </GlassPanel>
    </button>
  );
}