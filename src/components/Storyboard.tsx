import { motion } from 'motion/react';
import { Film, Image as ImageIcon, Music, Play, ExternalLink, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';

interface StoryboardProps {
  title: string;
  scenes: any[];
  mediaResults: {[key: string]: any};
  aspectRatio: '16:9' | '9:16';
}

export function Storyboard({ title, scenes, mediaResults, aspectRatio }: StoryboardProps) {
  const soundtrack = mediaResults['global-music']?.url;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyImage = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      handleCopy(url, id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 p-10 rounded-[4rem] text-white space-y-12 shadow-2xl relative overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-600/10 blur-[120px] -ml-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/5 blur-[120px] -mr-32 -mb-32" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 text-right">
          <div className="flex items-center gap-3 justify-end">
            <h2 className="text-3xl font-black tracking-tighter uppercase">{title}</h2>
            <div className="w-2 h-6 bg-green-500 rounded-full" />
          </div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em]">Preview_Nexus / Active_Project_Timeline</p>
        </div>
        
        {soundtrack && (
          <div className="flex items-center gap-4 bg-white/5 p-3 pr-6 rounded-2xl border border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest leading-none mb-1">Global Audio</p>
              <p className="text-[8px] text-zinc-400 font-mono">Neural_Score.wav</p>
            </div>
            <Music size={20} className="text-green-500" />
          </div>
        )}
      </div>

      <div className="relative z-10 flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar pr-4">
        {scenes.map((scene, i) => {
          const media = mediaResults[scene.id];
          const video = mediaResults[`video-${scene.id}`];
          const audio = mediaResults[`audio-${scene.id}`];

          return (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="flex-shrink-0 w-80 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-6 snap-center group hover:bg-white/10 transition-all duration-500"
            >
              <div className={`relative ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} rounded-3xl overflow-hidden bg-zinc-900 shadow-inner group/media`}>
                {video ? (
                  <video src={video.url} className="w-full h-full object-cover" autoPlay muted loop />
                ) : media?.url ? (
                  <img src={media.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3 opacity-30">
                    <ImageIcon size={32} />
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Missing Frame</p>
                  </div>
                )}
                
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black">{String(i + 1).padStart(2, '0')}</span>
                  {scene.duration && <span className="text-[8px] font-mono text-green-400 border-r border-white/20 pr-2">{scene.duration}s</span>}
                </div>

                {media?.url && (
                  <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopyImage(media.url, `media-${scene.id}`)}
                      className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg"
                      title="نسخ الصورة"
                    >
                      {copiedId === `media-${scene.id}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <a 
                      href={media.url} 
                      download={`storyboard-scene-${i + 1}.png`}
                      className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white"
                      title="تحميل الصورة"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                )}

                {audio && (
                  <div className="absolute bottom-4 right-4 p-2 bg-green-500 rounded-full shadow-lg">
                    <Music size={12} className="text-black" />
                  </div>
                )}
              </div>

              <div className="space-y-4 relative group/text">
                <div className="flex justify-between items-center px-1">
                  <button 
                    onClick={() => handleCopy(scene.visual, `text-${scene.id}`)}
                    className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-zinc-500 hover:text-white"
                  >
                    {copiedId === `text-${scene.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] text-right">Visual Prompt</p>
                </div>
                <p className="text-xs text-zinc-300 font-light line-clamp-3 leading-relaxed text-right italic" dir="ltr">
                  "{scene.visual}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${media ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`} />
                  <div className={`w-2 h-2 rounded-full ${audio ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-zinc-800'}`} />
                  <div className={`w-2 h-2 rounded-full ${video ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-zinc-800'}`} />
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Final Render Card */}
        <div className="flex-shrink-0 w-80 bg-gradient-to-br from-green-600 to-emerald-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 text-center snap-center shadow-xl shadow-green-900/40">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
             <Film size={28} className="text-white" />
           </div>
           <div className="space-y-2">
             <h4 className="text-xl font-black tracking-tight">جاهز للتصدير</h4>
             <p className="text-green-100/60 text-xs font-light">تمت مراجعة جميع المشاهد وتحسينها بواسطة Gemini Neural Engine.</p>
           </div>
           <button className="w-full py-4 bg-white text-green-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95">
             دمج وتصدير الفيديو
           </button>
        </div>
      </div>
    </motion.div>
  );
}
