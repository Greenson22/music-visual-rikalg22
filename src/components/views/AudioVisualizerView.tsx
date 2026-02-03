'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import MainLayout from '../layouts/MainLayout';
import VisualizerCanvas from '../fragments/VisualizerCanvas';
import SubtitleOverlay from '../fragments/SubtitleOverlay';
import AppHeader from '../fragments/AppHeader';
import UploadPrompt from '../fragments/UploadPrompt';
import PlayerControls from '../fragments/PlayerControls';
import GlassPanel from '../elements/GlassPanel';
import FileManager from '../fragments/FileManager'; // Import baru
import { Subtitle, FileNode } from '@/types';

// ... (Interface Particle tetap sama)
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
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackName, setTrackName] = useState('Unknown Track');
  const [statusText, setStatusText] = useState('Menunggu input audio...');
  const [showIntro, setShowIntro] = useState(true);
  const [isMicMode, setIsMicMode] = useState(false);
  
  // File Manager State (BARU)
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [showFileManager, setShowFileManager] = useState(false);

  // Subtitle State
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... (Bagian Logic AudioContext, ConnectAudioSource, InitParticles, RenderVisualizer SAMA SEPERTI SEBELUMNYA, tidak diubah) ...
  // (Saya mempersingkat bagian ini agar fokus pada perubahan, copy paste logic audio lama di sini)
    // 1. Inisialisasi Audio Context
    const initAudioContext = () => {
        if (!audioContextRef.current) {
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
        if (sourceRef.current) sourceRef.current.disconnect();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
    };

    // 3. Setup Partikel
    const initParticles = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        particlesRef.current = [];
        for (let i = 0; i < 100; i++) {
             particlesRef.current.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                color: `hsl(${Math.random() * 360}, 50%, 50%)`,
                velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                alpha: Math.random()
             });
        }
    };

    // 4. Render
    const renderVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        
        let bass = 0;
        for (let i = 0; i < 20; i++) if (dataArrayRef.current[i]) bass += dataArrayRef.current[i];
        bass = bass / 20; 
        const scale = 1 + (bass / 255) * 0.5;

        ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100 * scale;

        // Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${bass + 180}, 100%, 50%)`;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Bars
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

        // Particles
        particlesRef.current.forEach(p => {
            p.x += p.velocity.x * scale;
            p.y += p.velocity.y * scale;
            if (p.x < 0 || p.x > canvas.width) p.velocity.x *= -1;
            if (p.y < 0 || p.y > canvas.height) p.velocity.y *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        animationFrameRef.current = requestAnimationFrame(renderVisualizer);
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

  useEffect(() => {
     if(subtitles.length > 0) {
         const found = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
         setCurrentSubtitle(found ? found.text : '');
     }
  }, [currentTime, subtitles]);


  // --- HELPER UNTUK MEMBANGUN TREE FOLDER ---
  const buildFileTree = (files: FileList): FileNode => {
    const root: FileNode = { name: 'root', path: '', type: 'folder', children: [] };
    
    // Konversi FileList ke Array untuk iterasi yang mudah
    Array.from(files).forEach(file => {
      // Filter hanya file audio
      if (!file.type.startsWith('audio/')) return;

      const pathParts = file.webkitRelativePath.split('/');
      // webkitRelativePath contoh: "FolderUtama/SubFolder/Lagu.mp3"
      // Part pertama biasanya nama folder root yang dipilih user, kita bisa skip atau pakai
      
      let currentNode = root;

      // Iterasi path parts (kecuali nama file terakhir)
      for (let i = 0; i < pathParts.length - 1; i++) {
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

  // --- HANDLERS ---

  // Handler untuk SATU file langsung
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) playAudioFile(file);
  };

  // Handler untuk FOLDER
  const handleFolderUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const tree = buildFileTree(e.target.files);
      setFileTree(tree);
      setShowIntro(false);
      setShowFileManager(true);
      setStatusText("Menjelajahi File...");
    }
  };

  // Fungsi Play Central (dipakai oleh Upload Single & File Manager)
  const playAudioFile = (file: File) => {
    initAudioContext();
    if(audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setTrackName(file.name);
    setShowIntro(false);
    setShowFileManager(false); // Tutup manager saat play
    setIsMicMode(false);
    setStatusText("Memutar File Lokal");
    
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

  const handleMicMode = async () => {
      // (Sama seperti sebelumnya)
      try {
        initAudioContext();
        if(!audioContextRef.current || !analyserRef.current) return;
        if(audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

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
        
        if(audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
        renderVisualizer(); 
      } catch (err) { console.error("Mic Error:", err); alert("Gagal akses mikrofon."); }
  };

  const togglePlay = () => {
    if (audioRef.current && !isMicMode) {
        if (isPlaying) {
            audioRef.current.pause();
            cancelAnimationFrame(animationFrameRef.current);
        } else {
            if(audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
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

  // --- RENDER ---
  return (
    <MainLayout>
      <VisualizerCanvas canvasRef={canvasRef} />
      <SubtitleOverlay text={currentSubtitle} />
      
      <div className="relative z-20 h-screen flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Header dengan tombol Library jika fileTree ada */}
        <AppHeader 
            statusText={statusText} 
            onOpenModal={() => setIsModalOpen(true)}
            onMicMode={handleMicMode}
            onOpenLibrary={fileTree ? () => setShowFileManager(true) : undefined}
        />

        {showIntro && (
            <UploadPrompt 
                onFileUpload={handleFileUpload} 
                onFolderUpload={handleFolderUpload} 
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
             onClose={() => {
                // Jika sedang playing, cuma tutup overlay. Jika tidak, mungkin kembali ke intro?
                // Kita buat simple: tutup saja.
                setShowFileManager(false);
                if (!isPlaying && !audioRef.current?.src) {
                    setShowIntro(true); // Balik ke intro jika belum ada lagu dipilih
                }
             }}
          />
      )}

      {/* MODAL SETTINGS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm pointer-events-auto">
            <GlassPanel className="w-11/12 max-w-lg rounded-2xl p-6 relative flex flex-col max-h-[90vh]">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <i className="fas fa-times text-xl"></i>
                </button>
                <h2 className="text-xl font-bold mb-4">Pengaturan Lirik</h2>
                <p className="text-gray-300 mb-4">Fitur sinkronisasi lirik akan segera hadir.</p>
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition"
                    >
                        Tutup
                    </button>
                </div>
            </GlassPanel>
        </div>
      )}

      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onEnded={() => { setIsPlaying(false); cancelAnimationFrame(animationFrameRef.current); }}
        onTimeUpdate={() => {
             if(audioRef.current) {
                 setCurrentTime(audioRef.current.currentTime);
                 if(!isNaN(audioRef.current.duration)) setDuration(audioRef.current.duration);
             }
        }}
      />
    </MainLayout>
  );
}