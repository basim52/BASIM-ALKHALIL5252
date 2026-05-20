import { memo, useState } from 'react';
import { Camera, Mic, Play, RefreshCw, Image as ImageIcon, Video as VideoIcon, Check, Download, Copy, Sliders, Sparkles, Upload, Settings2, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface SceneCardProps {
  scene: any;
  onGenImage: () => void;
  onGenAudio: () => void;
  onGenVideo: () => void;
  onGenVideoWithOptions?: (options: { extendOnly?: boolean }) => void;
  onUpdate: (updates: any) => void;
  isGenerating: 'image' | 'audio' | 'video' | 'music' | null;
  media: any;
  videoMedia: any;
  audioUrl: string | null;
  aspectRatio: '16:9' | '9:16';
}

export const SceneCard = memo(({ scene, onGenImage, onGenAudio, onGenVideo, onGenVideoWithOptions, onUpdate, isGenerating, media, videoMedia, audioUrl, aspectRatio }: SceneCardProps) => {
  const [copiedType, setCopiedType] = useState<'visual' | 'audio' | 'image' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="group bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 flex flex-col md:flex-row gap-6 md:gap-12 transition-all duration-500 shadow-sm hover:shadow-xl text-right relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1 md:w-2 h-full bg-indigo-500/10" />
      
      <div className="flex md:flex-col items-center justify-between md:justify-start md:w-24 text-center gap-4 md:gap-6 border-b md:border-b-0 md:border-l border-slate-100 pb-4 md:pb-0 md:pl-10">
        <div className="flex flex-col items-center">
          <span className="text-[8px] md:text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] block font-black">المشهد</span>
          <span className="text-3xl md:text-5xl font-mono text-slate-200 group-hover:text-indigo-600 transition-colors font-black block leading-none mt-1">{scene.scene < 10 ? `0${scene.scene}` : scene.scene}</span>
        </div>
        
        {scene.duration && (
          <div className="flex flex-row md:flex-col items-center gap-3 md:gap-4">
             <div className="px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
               <span className="text-[9px] md:text-[10px] font-mono text-indigo-600 font-extrabold">{scene.duration}s</span>
             </div>
             {scene.emotionalBeat && (
               <div className="bg-slate-900 px-3 py-1.5 rounded-xl hidden md:block">
                 <p className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter mb-0.5">EMO_BEAT</p>
                 <p className="text-[9px] font-black text-white leading-tight uppercase">{scene.emotionalBeat}</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 md:space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-start">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3 relative group/text">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-[8px] md:text-[9px] font-black uppercase transition-all"
                   >
                     {isEditing ? 'حفظ' : 'تعديل'}
                   </button>
                   <button 
                      onClick={() => handleCopy(scene.visual, 'visual')}
                      className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-slate-300 hover:text-indigo-600"
                   >
                     {copiedType === 'visual' ? <Check size={12} /> : <Copy size={12} />}
                   </button>
                </div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 order-first">
                  <Camera size={12} className="text-indigo-600" /> الوصف البصري
                </label>
              </div>
              {isEditing ? (
                <textarea 
                  className="w-full bg-white border border-slate-100 p-4 rounded-xl text-xs md:text-sm font-bold text-right focus:ring-2 focus:ring-indigo-500 outline-none" 
                  rows={4}
                  value={scene.visual}
                  onChange={(e) => onUpdate({ visual: e.target.value })}
                />
              ) : (
                <p className="text-sm md:text-lg text-slate-900 font-display font-medium leading-relaxed select-all text-right">
                  {scene.visual}
                </p>
              )}
            </div>
            
            <div className="p-4 md:p-6 bg-indigo-50/30 rounded-2xl md:rounded-3xl border-r-2 md:border-r-4 border-indigo-100 group-hover:border-indigo-600 transition-colors relative group/audio">
               <div className="flex items-center justify-between mb-3 md:mb-4">
                 <button 
                   onClick={() => handleCopy(scene.audio, 'audio')}
                   className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors text-slate-300 hover:text-indigo-600"
                 >
                   {copiedType === 'audio' ? <Check size={12} /> : <Copy size={12} />}
                 </button>
                 <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 order-first">
                  <Mic size={12} className="text-indigo-600" /> النص الصوتي
                 </label>
               </div>
              {isEditing ? (
                <textarea 
                  className="w-full bg-white border border-slate-100 p-4 rounded-xl text-xs md:text-sm font-bold text-right focus:ring-2 focus:ring-indigo-500 outline-none" 
                  rows={2}
                  value={scene.audio}
                  onChange={(e) => onUpdate({ audio: e.target.value })}
                />
              ) : (
                 <p className="text-sm md:text-base text-slate-600 italic font-display leading-relaxed group-hover:text-slate-900 transition-colors text-right">
                  "{scene.audio}"
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
             <div className={`${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'} bg-slate-100 border border-slate-200 rounded-2xl md:rounded-3xl flex items-center justify-center overflow-hidden relative group/preview shadow-inner`}>
                {videoMedia ? (
                  <video src={videoMedia.url} controls className="w-full h-full object-cover" />
                ) : media?.type === 'image' ? (
                  <div className="w-full h-full relative group/img">
                    <img src={media.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 md:group-hover/img:opacity-100 transition-all flex items-center justify-center gap-3">
                       <button 
                         onClick={onGenImage}
                         disabled={isGenerating === 'image'}
                         className="p-2.5 md:p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="تغيير الصورة"
                       >
                         <RefreshCw size={18} className={`md:w-5 md:h-5 ${isGenerating === 'image' ? 'animate-spin' : ''}`} />
                       </button>
                       <button 
                         onClick={() => handleCopyImage(media.url)}
                         className="p-2.5 md:p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="نسخ الصورة"
                       >
                         {copiedType === 'image' ? <Check size={18} className="md:w-5 md:h-5" /> : <Copy size={18} className="md:w-5 md:h-5" />}
                       </button>
                       <a 
                         href={media.url} 
                         download={`scene-${scene.scene}.png`}
                         className="p-2.5 md:p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all active:scale-90"
                         title="تحميل الصورة"
                       >
                         <Download size={18} className="md:w-5 md:h-5" />
                       </a>
                    </div>
                  </div>
                ) : isGenerating === 'image' || isGenerating === 'video' ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-indigo-600" size={20} />
                    <span className="text-[9px] font-black text-slate-400 uppercase animate-pulse tracking-widest">
                      {isGenerating === 'image' ? 'جاري التخليق بصرياً' : 'جاري معالجة الفيديو'}
                    </span>
                  </div>
                ) : (
                  <ImageIcon size={32} className="text-slate-200" />
                )}
                
                {!media && !videoMedia && !isGenerating && (
                  <div className="absolute inset-0 bg-white/90 opacity-100 md:opacity-0 md:group-hover/preview:opacity-100 transition-opacity flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 backdrop-blur-sm px-4">
                    <button 
                      onClick={onGenImage} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      <ImageIcon size={14} /> إطار
                    </button>
                    <button 
                      onClick={onGenVideo} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      <VideoIcon size={14} /> فيديو
                    </button>
                  </div>
                )}
             </div>

             <div className="flex gap-2 md:gap-3">
               <button 
                 disabled={isGenerating === 'audio'}
                 onClick={onGenAudio}
                 className="flex-1 bg-slate-50 border border-slate-200 hover:border-indigo-600 p-2.5 md:p-4 rounded-xl flex items-center justify-center gap-2 md:gap-3 transition-all disabled:opacity-50 shadow-sm group/btn"
               >
                 {isGenerating === 'audio' ? <RefreshCw className="animate-spin w-4 h-4 text-indigo-600" /> : <Play size={14} className="text-indigo-600 rotate-180 md:w-4 md:h-4" />}
                 <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">تشغيل الصوت</span>
               </button>
               {audioUrl && (
                  <button onClick={() => new Audio(audioUrl).play()} className="w-10 md:w-14 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Check size={16} />
                  </button>
               )}
               {media?.type === 'image' && (
                  <a href={media.url} download={`scene-${scene.scene}.png`} className="w-10 md:w-14 bg-slate-900 hover:bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white transition-colors">
                    <Download size={16} />
                  </a>
               )}
               {videoMedia && (
                  <a href={videoMedia.url} download={`scene-${scene.scene}.mp4`} className="w-10 md:w-14 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center animate-pulse shadow-lg text-white">
                    <Download size={16} />
                  </a>
               )}
             </div>
          </div>
        </div>

        {/* Advanced Veo Studio Collapsible Controls */}
        <div className="border-t border-slate-100/80 pt-6 mt-6 w-full flex flex-col gap-6 text-right" dir="rtl">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between text-xs font-black text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50/65 hover:bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-indigo-600" />
              <span>أدوات Veo المتقدمة • Veo Video Director Studio</span>
            </div>
            <span className="text-slate-400 font-bold">{showAdvanced ? "إخفاء الخيارات -" : "عرض خيارات التحريك المتقدمة +"}</span>
          </button>

          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/45 p-6 rounded-3xl border border-slate-100 shadow-inner"
            >
              {/* 1. Transitions Column */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sliders size={12} className="text-indigo-600" /> حركة وتدفق المشهد (Transitions)
                </label>
                
                <div className="space-y-2">
                  <select
                    value={scene.transitionType || 'none'}
                    onChange={(e) => onUpdate({ transitionType: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs outline-none focus:ring-1.5 focus:ring-indigo-500/20"
                  >
                    <option value="none">بدون انتقال (مباشر • Cut)</option>
                    <option value="cross_fade">تلاشي تدريجي (Cross-Dissolve)</option>
                    <option value="push_pan">حركة كاميرا مستمرة (Continuous Pan)</option>
                    <option value="match_frame">ربط الإطار المرجعي (Continuity Link)</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="وصف إضافي لطاقة الحركة..."
                    className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 shadow-xs outline-none"
                    value={scene.transitionPrompt || ''}
                    onChange={(e) => onUpdate({ transitionPrompt: e.target.value })}
                  />
                </div>
              </div>

              {/* 2. Style-Transfer Column */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-emerald-500" /> نقل الأنماط البصرية (Style Transfer)
                </label>

                <div className="space-y-2">
                  <select
                    value={scene.styleRefType || 'none'}
                    onChange={(e) => onUpdate({ styleRefType: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs outline-none focus:ring-1.5 focus:ring-indigo-500/20"
                  >
                    <option value="none">بدون نقل نمط (رسم عادي)</option>
                    <option value="this_frame">استخدام صورة هذا المشهد كنمط مرجعي</option>
                    <option value="prev_frame font-sans">استخدام إطار المشهد السابق</option>
                    <option value="custom">تحميل صورة نمط مخصصة مرجعية (Reference)</option>
                  </select>

                  {scene.styleRefType === 'custom' && (
                    <div className="flex flex-col gap-2">
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 cursor-pointer text-center hover:bg-indigo-50/20 transition-all font-sans"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            const r = new FileReader();
                            r.onload = () => onUpdate({ styleRefImage: (r.result as string).split(',')[1] });
                            r.readAsDataURL(file);
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => onUpdate({ styleRefImage: (r.result as string).split(',')[1] });
                              r.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {scene.styleRefImage ? (
                          <div className="w-full text-center py-2 text-[10px] text-indigo-600 font-bold flex items-center justify-center gap-2 font-display">
                            <Check size={12} /> تم رفع صورة النمط بنجاح
                          </div>
                        ) : (
                          <>
                            <Upload size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter font-display">اسحب أو انقر لرفع صورة النمط</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Multi-Clip Sequencing & Extending */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <VideoIcon size={12} className="text-rose-600" /> تسلسل وإطالة الفيديو (Extend Studio)
                </label>

                <div className="space-y-2 font-display">
                  {videoMedia ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text"
                        placeholder="صف الحركة الممتدة للتوسيع..."
                        className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 shadow-xs outline-none"
                        value={scene.extendPrompt || ''}
                        onChange={(e) => onUpdate({ extendPrompt: e.target.value })}
                      />
                      <button
                        type="button"
                        disabled={isGenerating === 'video'}
                        onClick={() => onGenVideoWithOptions?.({ extendOnly: true })}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        {isGenerating === 'video' ? <RefreshCw className="animate-spin" size={12} /> : <Plus size={12} />}
                        إطالة وتوسيع كليب الفيديو (+7 ثوانٍ)
                      </button>
                      <p className="text-[8px] font-mono font-bold text-slate-400 text-center leading-normal">
                        تمديد زمني ذكي يعتمد على آخر فريم من الفيديو الأساسي لثبات بصري كامل
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[10px] font-bold text-slate-400/80 bg-slate-100 rounded-xl leading-normal border border-slate-200/40">
                      يلزم توليد كليب فيديو أساسي أولاً للمشهد لتفعيل خيارات التوسيع والإطالة الذكية.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
});
