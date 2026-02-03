// src/components/views/AudioVisualizerView.tsx
'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import MainLayout from '../layouts/MainLayout';
import VisualizerCanvas from '../fragments/VisualizerCanvas';
import SubtitleOverlay from '../fragments/SubtitleOverlay';
import AppHeader from '../fragments/AppHeader';
import UploadPrompt from '../fragments/UploadPrompt';
import PlayerControls from '../fragments/PlayerControls';
import FileManager from '../fragments/FileManager';
// Import Modal Baru
import SubtitleModal from '../fragments/SubtitleModal';
import { Subtitle, FileNode } from '@/types';

// Definisi Tipe untuk Partikel Visual
interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: { x: number; y: number };
  alpha: number;
}

export default function AudioVisualizerView() {
  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Ref untuk Source yang sedang aktif (bisa Mic atau File)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  
  // Ref khusus untuk menyimpan Source Audio Element agar tidak dibuat ulang (Penyebab Error)
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Ref khusus untuk input folder agar bisa dipanggil berulang kali
  const folderInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackName, setTrackName] = useState('Unknown Track');
  const [statusText, setStatusText] = useState('Menunggu input audio...');
  
  const [showIntro, setShowIntro] = useState(true);
  const [isMicMode, setIsMicMode] = useState(false);
  
  // File Manager State
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [showFileManager, setShowFileManager] = useState(false);

  // --- SUBTITLE STATE (DIPERBARUI) ---
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [subtitleDurationLimit, setSubtitleDurationLimit] = useState(0);

  // --- LOGIC IMPLEMENTATION ---

  // 1. Inisialisasi Audio Context
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      // Menangani kompatibilitas browser
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; 
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
  };

  // 2. Hubungkan Audio Element (File) ke Analyser
  const connectAudioSource = () => {
    if (!audioRef.current || !audioContextRef.current || !analyserRef.current) return;

    // Putuskan koneksi source yang sedang aktif sebelumnya
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }

    // Cek apakah kita sudah pernah membuat MediaElementSource untuk <audio> ini?
    if (!mediaElementSourceRef.current) {
        // Jika belum, buat baru (hanya sekali seumur hidup komponen)
        mediaElementSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    }

    // Gunakan instance yang sudah ada di cache
    sourceRef.current = mediaElementSourceRef.current;

    // Sambungkan kembali ke Analyser
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
  };

  // 3. Setup Partikel Visual
  const initParticles = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    particlesRef.current = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1,
        color: `hsl(${Math.random() * 360}, 50%, 50%)`,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        },
        alpha: Math.random()
      });
    }
  };

  // 4. Loop Animasi (Render Visualizer)
  const renderVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Gunakan 'as any' untuk menghindari strict type checking pada Uint8Array
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
    
    // Hitung rata-rata bass
    let bass = 0;
    for (let i = 0; i < 20; i++) {
        if (dataArrayRef.current[i]) {
            bass += dataArrayRef.current[i];
        }
    }
    bass = bass / 20; 
    const scale = 1 + (bass / 255) * 0.5;

    // Clear Canvas
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
    ctx.fillRect(0, 0, width, height);

    // Draw Circle Center
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 100 * scale;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${bass + 180}, 100%, 50%)`;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${bass + 180}, 100%, 50%)`;

    // Draw Frequency Bars
    const barCount = 60;
    const step = (Math.PI * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (dataArrayRef.current.length / 2));
        const value = dataArrayRef.current[dataIndex] || 0;
        const barHeight = (value / 255) * 100 * scale;
        
        const angle = i * step;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsl(${i * 5 + bass}, 70%, 60%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
        p.x += p.velocity.x * scale;
        p.y += p.velocity.y * scale;

        if (p.x < 0 || p.x > width) p.velocity.x *= -1;
        if (p.y < 0 || p.y > height) p.velocity.y *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    animationFrameRef.current = requestAnimationFrame(renderVisualizer);
  };

  // --- HELPER UNTUK MEMBANGUN TREE FOLDER ---
  const buildFileTree = (files: FileList): FileNode => {
    // Root default
    const root: FileNode = { name: 'Library', path: '', type: 'folder', children: [] };
    
    Array.from(files).forEach(file => {
      // Filter hanya file audio
      if (!file.type.startsWith('audio/')) return;

      const pathParts = file.webkitRelativePath.split('/');
      
      // Ambil nama root folder asli dari file pertama jika masih default
      if(root.name === 'Library' && pathParts.length > 0) {
          root.name = pathParts[0]; 
      }

      let currentNode = root;

      // Iterasi path (skip root folder name di index 0 dan nama file di index terakhir)
      for (let i = 1; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        let child = currentNode.children.find(c => c.name === part && c.type === 'folder');
        
        if (!child) {
          child = { name: part, path: '', type: 'folder', children: [] };
          currentNode.children.push(child);
        }
        currentNode = child;
      }

      // Tambahkan file di node terakhir
      const fileName = pathParts[pathParts.length - 1];
      currentNode.children.push({
        name: fileName,
        path: file.webkitRelativePath,
        type: 'file',
        file: file,
        children: []
      });
    });

    return root;
  };

  // --- EFFECTS ---

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            initParticles();
        }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- SUBTITLE UPDATE LOGIC (DIPERBARUI) ---
  useEffect(() => {
     if(subtitles.length > 0) {
         // Terapkan offset waktu
         const lookupTime = currentTime - subtitleOffset;
         
         const found = subtitles.find(s => lookupTime >= s.start && lookupTime <= s.end);
         
         if (found) {
             // Logic duration limit (auto hide)
             // Jika limit > 0 DAN waktu berlalu sejak start subtitle > limit
             if (subtitleDurationLimit > 0 && (lookupTime - found.start > subtitleDurationLimit)) {
                 setCurrentSubtitle('');
             } else {
                 setCurrentSubtitle(found.text);
             }
         } else {
             setCurrentSubtitle('');
         }
     } else {
         setCurrentSubtitle('');
     }
  }, [currentTime, subtitles, subtitleOffset, subtitleDurationLimit]);


  // --- HANDLERS ---

  // 1. Handler Folder Change (Centralized)
  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const tree = buildFileTree(e.target.files);
      setFileTree(tree);
      setShowIntro(false);
      setShowFileManager(true); 
      setStatusText(`Library: ${tree.name}`);
    }
  };

  // 2. Trigger Klik Input Folder Hidden
  const triggerFolderSelect = () => {
      if (folderInputRef.current) {
          folderInputRef.current.value = ''; 
          folderInputRef.current.click();
      }
  };

  // 3. Handler Single File Upload
  const handleSingleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) playAudioFile(file);
  };

  // 4. Play Audio Logic
  const playAudioFile = (file: File) => {
    initAudioContext();
    if(audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setTrackName(file.name);
    setShowIntro(false);
    setShowFileManager(false); 
    setIsMicMode(false);
    setStatusText("Memutar File Lokal");
    
    // Reset subtitles saat ganti lagu
    setSubtitles([]); 
    setCurrentSubtitle('');

    const objectUrl = URL.createObjectURL(file);
    if(audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.load();
        
        connectAudioSource();
        
        audioRef.current.play()
            .then(() => {
                setIsPlaying(true);
                renderVisualizer(); 
            })
            .catch(err => console.error("Playback failed", err));
    }
  };

  // 5. Mic Mode Logic
  const handleMicMode = async () => {
      try {
        initAudioContext();
        if(!audioContextRef.current || !analyserRef.current) return;
        
        if(audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if(sourceRef.current) sourceRef.current.disconnect();

        const micSource = audioContextRef.current.createMediaStreamSource(stream);
        micSource.connect(analyserRef.current);
        sourceRef.current = micSource;

        setIsMicMode(true);
        setShowIntro(false);
        setShowFileManager(false);
        setStatusText("Mode Mikrofon Aktif");
        setIsPlaying(true);
        
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }

        renderVisualizer(); 

      } catch (err) {
          console.error("Mic Error:", err);
          alert("Gagal akses mikrofon. Pastikan izin diberikan.");
      }
  };

  // 6. Player Controls
  const togglePlay = () => {
    if (audioRef.current && !isMicMode) {
        if (isPlaying) {
            audioRef.current.pause();
            cancelAnimationFrame(animationFrameRef.current);
        } else {
            if(audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            audioRef.current.play();
            renderVisualizer();
        }
        setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
      if(audioRef.current && duration) {
          const newTime = (parseFloat(e.target.value) / 100) * duration;
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
      }
  };

  // 7. Handler Simpan Subtitle dari Modal
  const handleSaveSubtitles = (subs: Subtitle[], offset: number, limit: number) => {
      setSubtitles(subs);
      setSubtitleOffset(offset);
      setSubtitleDurationLimit(limit);
      setStatusText(`Lirik dimuat: ${subs.length} baris`);
  };

  // --- RENDER ---
  return (
    <MainLayout>
      <VisualizerCanvas canvasRef={canvasRef} />
      <SubtitleOverlay text={currentSubtitle} />
      
      {/* INPUT FOLDER TERSEMBUNYI (GLOBAL) */}
      <input 
          type="file" 
          ref={folderInputRef}
          onChange={handleFolderChange} 
          {...({ webkitdirectory: "", directory: "" } as any)} 
          className="hidden" 
      />

      <div className="relative z-20 h-screen flex flex-col justify-between p-6 pointer-events-none">
        
        <AppHeader 
            statusText={statusText} 
            onOpenModal={() => setIsModalOpen(true)}
            onMicMode={handleMicMode}
            onOpenLibrary={fileTree ? () => setShowFileManager(true) : undefined}
        />

        {showIntro && (
            <UploadPrompt 
                onFileUpload={handleSingleFileUpload} 
                onTriggerFolder={triggerFolderSelect} 
            />
        )}

        {!showIntro && !isMicMode && !showFileManager && (
            <PlayerControls 
                isPlaying={isPlaying}
                togglePlay={togglePlay}
                trackName={trackName}
                currentTime={currentTime}
                duration={duration}
                handleSeek={handleSeek}
                formatTime={(s) => {
                    if(!s) return "00:00";
                    const min = Math.floor(s / 60);
                    const sec = Math.floor(s % 60);
                    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
                }}
            />
        )}
      </div>

      {/* FILE MANAGER OVERLAY */}
      {showFileManager && fileTree && (
          <FileManager 
             rootNode={fileTree} 
             onSelectFile={playAudioFile} 
             onClose={() => setShowFileManager(false)}
             onChangeFolder={triggerFolderSelect}
          />
      )}

      {/* SUBTITLE MODAL (BARU) */}
      <SubtitleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        audioRef={audioRef}
        onSave={handleSaveSubtitles}
      />

      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onEnded={() => {
            setIsPlaying(false);
            cancelAnimationFrame(animationFrameRef.current);
        }}
        onTimeUpdate={() => {
             if(audioRef.current) {
                 setCurrentTime(audioRef.current.currentTime);
                 if(!isNaN(audioRef.current.duration)) {
                     setDuration(audioRef.current.duration);
                 }
             }
        }}
      />
    </MainLayout>
  );
}