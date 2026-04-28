import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Clapperboard, Sparkles } from 'lucide-react';

interface StoryboardPreviewProps {
  script: any[];
  mediaResults: {[key: string]: {type: 'image' | 'audio' | 'video' | 'music', url: string}};
  title: string;
}

export function StoryboardPreview({ script, mediaResults, title }: StoryboardPreviewProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const currentScene = script[currentSceneIndex];
  const sceneMedia = mediaResults[currentScene?.id || ''];
  const videoMedia = mediaResults[`video-${currentScene?.id}`];
  const sceneAudio = mediaResults[`audio-${currentScene?.id}`];
  const musicMedia = mediaResults['global-music'];

  useEffect(() => {
    if (isPlaying) {
      // Play scene audio if available
      if (sceneAudio?.url) {
        if (audioRef.current) {
          audioRef.current.src = sceneAudio.url;
          audioRef.current.muted = isMuted;
          audioRef.current.play().catch(e => console.error("Audio play failed:", e));
          
          audioRef.current.onended = () => {
            handleNext();
          };
        }
      } else {
        // If no audio, wait for scene duration or default 5s
        const duration = (currentScene?.duration || 5) * 1000;
        const timer = setTimeout(() => {
          handleNext();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isPlaying, currentSceneIndex, sceneAudio, isMuted]);

  useEffect(() => {
    if (musicMedia?.url) {
      if (musicRef.current) {
        musicRef.current.src = musicMedia.url;
        musicRef.current.loop = true;
        musicRef.current.volume = 0.3; // Low volume for background music
        musicRef.current.muted = isMuted;
        if (isPlaying) {
          musicRef.current.play().catch(e => console.error("Music play failed:", e));
        } else {
          musicRef.current.pause();
        }
      }
    }
  }, [musicMedia, isPlaying, isMuted]);

  const handleNext = () => {
    if (currentSceneIndex < script.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentSceneIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  if (!script || script.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-green-600 rounded-full" />
          <h2 className="text-3xl font-black text-zinc-900 capitalize">معاينة الفيلم النهائي</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-mono font-bold tracking-widest uppercase">
          <Clapperboard size={12} className="text-green-500" /> {title || 'Video Project'}
        </div>
      </div>

      <div className="relative group aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
        {/* Background Visual */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSceneIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {videoMedia ? (
              <video 
                src={videoMedia.url} 
                autoPlay 
                muted={true} 
                loop 
                className="w-full h-full object-cover"
              />
            ) : sceneMedia?.url ? (
              <img 
                src={sceneMedia.url} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                alt={`Scene ${currentSceneIndex + 1}`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-700 space-y-4">
                <Clapperboard size={48} className="animate-pulse" />
                <p className="text-xs font-mono uppercase tracking-widest">المشهد جاري التخليل...</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        
        {/* Subtitles / Audio Text */}
        <div className="absolute bottom-20 left-0 right-0 p-8 text-center">
           <motion.p 
             key={currentSceneIndex}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-white text-2xl font-bold leading-relaxed max-w-4xl mx-auto drop-shadow-lg"
             style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
           >
             {currentScene?.audio}
           </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
          <motion.div 
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentSceneIndex + 1) / script.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>

        {/* Controls Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="flex items-center gap-8">
             <button onClick={handlePrev} className="p-4 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md text-white transition-all">
                <SkipBack size={32} />
             </button>
             <button onClick={togglePlay} className="p-8 bg-green-500 hover:bg-green-400 rounded-full text-white shadow-2xl transition-all active:scale-90 scale-110">
                {isPlaying ? <Pause size={48} /> : <Play size={48} className="ml-1" />}
             </button>
             <button onClick={handleNext} className="p-4 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-md text-white transition-all">
                <SkipForward size={32} />
             </button>
          </div>
        </div>

        {/* Mini Controls Block */}
        <div className="absolute top-8 right-8 flex items-center gap-3">
           <button onClick={toggleMute} className="p-3 bg-black/40 hover:bg-black/60 rounded-xl backdrop-blur-md text-white border border-white/10 transition-all">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
           </button>
           <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white text-[10px] font-mono font-black">
              {currentSceneIndex + 1} / {script.length}
           </div>
        </div>
      </div>

      {/* Music Status Bar */}
      {musicMedia && (
        <div className="bg-white border border-green-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                 <Sparkles size={18} className="animate-spin-slow" />
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">الموسيقى التصويرية</p>
                 <p className="text-xs font-black text-zinc-900">Background Orchestral Suite Active</p>
              </div>
           </div>
           <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: isPlaying ? [8, 16, 8] : 8 }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  className="w-1 bg-green-500 rounded-full"
                />
              ))}
           </div>
        </div>
      )}

      {/* Hidden Audio Elements */}
      <audio ref={audioRef} />
      <audio ref={musicRef} />
    </div>
  );
}
