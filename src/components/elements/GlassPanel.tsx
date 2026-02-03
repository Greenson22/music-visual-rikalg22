import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassPanel({ children, className = '', onClick }: GlassPanelProps) {
  return (
    <div onClick={onClick} className={`glass-panel ${className}`}>
      {children}
    </div>
  );
}