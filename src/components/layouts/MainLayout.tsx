import React from 'react';
import Head from 'next/head';

interface Props {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      <Head>
        <title>Aesthetic Audio Visualizer</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Global Styles injected here if needed, or rely on globals.css */}
      
      {children}
    </div>
  );
}