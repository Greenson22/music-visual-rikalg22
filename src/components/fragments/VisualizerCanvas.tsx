import React, { RefObject } from 'react';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function VisualizerCanvas({ canvasRef }: Props) {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
      <canvas ref={canvasRef} id="visualizer" className="block w-full h-full"></canvas>
    </div>
  );
}