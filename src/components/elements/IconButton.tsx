import React from 'react';
import GlassPanel from './GlassPanel';

interface IconButtonProps {
  icon: string;
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function IconButton({ icon, onClick, title, className = '' }: IconButtonProps) {
  return (
    <button onClick={onClick} title={title} className="focus:outline-none">
      <GlassPanel className={`w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-cyan-400 transition-colors ${className}`}>
        <i className={`fas ${icon}`}></i>
      </GlassPanel>
    </button>
  );
}