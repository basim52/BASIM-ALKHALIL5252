import { memo, useState } from 'react';
import { Camera, Mic, Play, RefreshCw, Image as ImageIcon, Video as VideoIcon, Check, Download, Copy } from 'lucide-react';

interface SceneCardProps {
  scene: any;
  onGenImage: () => void;
  onGenAudio: () => void;
  onGenVideo: () => void;
  onUpdate: (updates: any) => void;
  isGenerating: 'image' | 'audio' | 'video' | 'music' | null;
  media: any;
  videoMedia: any;
  audioUrl: string | null;
  aspectRatio: '16:9' | '9:16';
}

export const SceneCard = memo(({ scene, onGenImage, onGenAudio, onGenVideo, onUpdate, isGenerating, media, videoMedia, audioUrl, aspectRatio }: SceneCardProps) => {
  const [copiedType, setCopiedType] = useState<'visual' | 'audio' | 'image' | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = (text: string, type: 'visual' | 'audio' | 'image') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedType('image');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      handleCopy(url, 'image');
    }
  };

  return (
    <div className="group bg-white border border-green-100 hover:border-green-300 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 transition-all duration-500 shadow-sm hover:shadow-md text-right">
      <div className="flex-shrink-0 w-16 md:w-20 text-center space-y-2 border-l border-green-50 pl-4 md:pl-8">
        <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest block font-bold">المشهد</span>
        <span className="text-4xl font-mono text-zinc-200 group-hover:text-green-500 transition-colors font-black block">{scene.scene < 10 ? `0${scene.scene}` : scene.scene}</span>
        {scene.duration && (
          <div className="pt-2 border-t border-green-50 space-y-2">
             <span className="text-[10px] font-mono text-green-600 font-bold">{scene.duration} ثانية</span>
             {scene.emotionalBeat && (
               <div className="bg-zinc-50 border-r-2 border-green-500 py-1 px-2 rounded-l-md">
                 <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter mb-0.5">النبض</p>
                 <p className="text-[10px] font-bold text-zinc-700 leading-tight">{scene.emotionalBeat}</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-3 relative group/text">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center justify-end gap-2 font-bold">
                <Camera size={14} className="text-green-600" /> تعليمات الرؤية العصبية (Director's Input)
                <button 
                   onClick={() => setIsEditing(!isEditing)}
                   className="p-1 px-2 bg-zinc-50 border border-zinc-100 rounded text-[8px] hover:bg-zinc-900 hover:text-white transition-all ml-2"
                >
                  {isEditing ? 'حفظ التعديلات' : 'تعديل يدوي'}
                </button>
                <button 
                  onClick={() => handleCopy(scene.visual, 'visual')}
                  className="mr-auto p-1.5 hover:bg-green-50 rounded-md transition-colors text-zinc-300 hover:text-green-600 opacity-0 group-hover/text:opacity-100"
                >
                  {copiedType === 'visual' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-sm font-mono text-left" 
                  rows={4}
                  dir="ltr"
                  value={scene.visual}
                  onChange={(e) => onUpdate({ visual: e.target.value })}
                />
              ) : (
                <p className="text-lg text-zinc-900 font-light leading-relaxed select-all text-right" dir="ltr">
                  {scene.visual}
                </p>
              )}
            </div>
            
            <div className="p-5 bg-green-50/50 rounded-2xl border-r-[3px] border-green-100 group-hover/text:border-green-600 transition-colors relative group/audio">
               <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center justify-end gap-2 mb-3 font-bold text-right">
                <Mic size={14} /> بيانات التعلق الصوتي
                <button 
                  onClick={() => handleCopy(scene.audio, 'audio')}
                  className="mr-auto p-1.5 hover:bg-green-100 rounded-md transition-colors text-zinc-300 hover:text-green-600 opacity-0 group-hover/audio:opacity-100"
                >
                  {copiedType === 'audio' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full bg-white border border-zinc-100 p-4 rounded-xl text-sm font-medium text-right" 
                  rows={2}
                  value={scene.audio}
                  onChange={(e) => onUpdate({ audio: e.target.value })}
                />
              ) : (
                <p className="text-zinc-600 italic font-serif leading-relaxed line-clamp-3 group-hover:text-zinc-900 transition-colors text-right">
                  "{scene.audio}"
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
             <div className={`${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-zinc-100 border border-green-100 rounded-2xl flex items-center justify-center overflow-hidden relative group`}>
                {videoMedia ? (
                  <video src={videoMedia.url} controls className="w-full h-full object-cover" />
                ) : media?.type === 'image' ? (
                  <div className="w-full h-full relative group/img">
                    <img src={media.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-3">
                       <button 
                         onClick={onGenImage}
                         disabled={isGenerating === 'image'}
                         className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="تغيير الصورة"
                       >
                         <RefreshCw size={20} className={isGenerating === 'image' ? 'animate-spin' : ''} />
                       </button>
                       <button 
                         onClick={() => handleCopyImage(media.url)}
                         className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="نسخ الصورة"
                       >
                         {copiedType === 'image' ? <Check size={20} /> : <Copy size={20} />}
                       </button>
                       <a 
                         href={media.url} 
                         download={`scene-${scene.scene}.png`}
                         className="p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="تحميل الصورة"
                       >
                         <Download size={20} />
                       </a>
                    </div>
                  </div>
                ) : isGenerating === 'image' || isGenerating === 'video' ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-green-600" size={24} />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase animate-pulse">
                      {isGenerating === 'image' ? 'تخليق الإطار...' : 'تخليق الفيديو الموسع...'}
                    </span>
                  </div>
                ) : (
                  <ImageIcon size={32} className="text-zinc-200" />
                )}
                
                {!media && !videoMedia && !isGenerating && (
                  <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <button 
                      onClick={onGenImage} 
                      className="flex items-center gap-2 bg-zinc-900 hover:bg-green-600 px-4 py-2 rounded-lg text-[10px] font-mono text-white uppercase tracking-widest transition-all shadow-lg"
                    >
                      <ImageIcon size={14} /> إطار مرجع
                    </button>
                    <button 
                      onClick={onGenVideo} 
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-[10px] font-mono text-white uppercase tracking-widest transition-all shadow-lg"
                    >
                      <VideoIcon size={14} /> حركة (Veo)
                    </button>
                  </div>
                )}
             </div>

             <div className="flex gap-3">
               <button 
                 disabled={isGenerating === 'audio'}
                 onClick={onGenAudio}
                 className="flex-1 bg-white border border-green-100 hover:bg-green-50 hover:border-green-600 p-3 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-sm"
               >
                 {isGenerating === 'audio' ? <RefreshCw className="animate-spin w-4 h-4 text-green-600" /> : <Play size={16} className="text-green-600 rotate-180" />}
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">معاينة الصوت</span>
               </button>
               {audioUrl && (
                  <button onClick={() => new Audio(audioUrl).play()} className="w-12 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-center text-green-600 border border-green-100">
                    <Check size={18} />
                  </button>
               )}
               {media?.type === 'image' && (
                  <a href={media.url} download={`scene-${scene.scene}.png`} className="w-12 bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center shadow-lg text-white">
                    <Download size={18} />
                  </a>
               )}
               {videoMedia && (
                  <a href={videoMedia.url} download={`scene-${scene.scene}.mp4`} className="w-12 bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center animate-pulse shadow-lg text-white">
                    <Download size={18} />
                  </a>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});
