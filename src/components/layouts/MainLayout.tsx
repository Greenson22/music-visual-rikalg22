import React from 'react';
import Head from 'next/head';

interface Props {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      <Head>
        {/* Update Title Browser */}
        <title>F. R. Gerung Visualizer</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;700&display=swap" rel="stylesheet" />
      </Head>
      
      {children}
    </div>
  );
}