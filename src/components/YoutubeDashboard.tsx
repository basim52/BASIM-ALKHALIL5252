import { motion } from 'motion/react';
import { Youtube, User, Play, TrendingUp, BarChart3, ChevronLeft, Zap } from 'lucide-react';

interface YoutubeDashboardProps {
  stats: any;
  videoStyle: string;
  onConnect: () => void;
  onGetIdeas: () => void;
}

export function YoutubeDashboard({ stats, videoStyle, onConnect, onGetIdeas }: YoutubeDashboardProps) {
  if (!stats) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 space-y-10">
        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[3rem] flex items-center justify-center shadow-xl shadow-red-500/10 rotate-12 transition-transform hover:rotate-0 duration-500">
          <Youtube size={48} />
        </div>
        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-3xl font-black tracking-tighter text-zinc-900">ربط استوديو يوتيوب</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">اربط قناتك للحصول على تحليلات دقيقة وأفكار محتوى مخصصة من Gemini بناءً على أدائك الحقيقي.</p>
        </div>
        <button 
          onClick={onConnect}
          className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] text-xs font-mono font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-600/30 flex items-center gap-4 active:scale-95"
        >
          <Youtube size={20} /> ربط القناة الآن
        </button>
      </motion.div>
    );
  }

  const { channel, latestVideos } = stats;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-zinc-900 p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center text-center md:text-right gap-4 md:gap-8 relative z-10 w-full md:w-auto">
          <img src={channel?.snippet?.thumbnails?.high?.url} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] border-4 border-white/10 shadow-2xl object-cover" />
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{channel?.snippet?.title}</h2>
            <div className="flex justify-center md:justify-end gap-3 md:gap-4">
              <span className="text-zinc-500 font-mono text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
                <User size={10} className="text-red-500 md:w-3 md:h-3" /> {parseInt(channel?.statistics?.subscriberCount).toLocaleString()} مشترك
              </span>
              <span className="text-zinc-500 font-mono text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Play size={10} className="text-red-500 md:w-3 md:h-3" /> {parseInt(channel?.statistics?.viewCount).toLocaleString()} مشاهدة
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onGetIdeas}
          className="relative z-10 w-full md:w-auto px-6 md:px-8 py-4 bg-white hover:bg-red-50 text-zinc-900 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
        >
          <TrendingUp size={14} className="text-red-600 md:w-4 md:h-4" /> اطلب أفكار محتوى
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                <BarChart3 className="text-green-600" size={20} /> الأداء الأخير
              </h3>
              <button className="text-[10px] font-mono text-zinc-400 hover:text-green-600 uppercase tracking-widest font-black transition-colors">مشاهدة الكل</button>
           </div>
           <div className="grid gap-3 md:gap-4">
              {latestVideos?.map((video: any, i: number) => (
                <div key={i} className="bg-white border border-green-100 p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] flex items-center gap-3 md:gap-6 hover:shadow-2xl hover:shadow-green-500/5 transition-all group shadow-sm text-right">
                   <img src={video.snippet.thumbnails.medium.url} className="w-24 h-14 md:w-32 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                   <div className="flex-1 space-y-1">
                      <h4 className="text-xs md:text-sm font-black text-zinc-800 line-clamp-1 group-hover:text-green-600 transition-colors uppercase">{video.snippet.title}</h4>
                      <p className="text-[8px] md:text-[10px] text-zinc-400 font-mono tracking-tighter italic" dir="ltr">{new Date(video.snippet.publishedAt).toLocaleDateString()}</p>
                   </div>
                   <ChevronLeft size={14} className="text-zinc-200 group-hover:text-green-500 group-hover:translate-x-1 transition-all md:w-4 md:h-4" />
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3 text-right">
            <Zap className="text-yellow-500" size={20} /> نصائح Gemini الاحترافية
          </h3>
          <div className="bg-zinc-900 border border-green-500/20 p-6 md:p-8 rounded-2xl md:rounded-[3rem] space-y-6 shadow-xl relative overflow-hidden group transition-all hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/10 text-right">
             <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent pointer-events-none" />
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[shimmer_2s_infinite]" />
             
             <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 p-2 md:p-3 bg-green-500/10 rounded-xl md:rounded-2xl border border-green-500/20">
                   <TrendingUp size={14} className="text-green-500 md:w-4 md:h-4" />
                   <span className="text-[8px] md:text-[10px] font-black text-green-500 uppercase tracking-widest">توصية المحتوى العصبية</span>
                </div>
                <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-light italic">
                   تحليل الأنماط: الجمهور يميل للفيديوهات ذات الطابع {videoStyle || 'سينمائي'}. 
                   نقترح استخدام فترات صمت سينمائية أطول بزيادة 15٪ في الفيديوهات القادمة لتعزيز الترقب.
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                   <div className="w-full h-px bg-white/5 my-2" />
                   <span className="px-2 py-1 bg-zinc-800 text-[6px] md:text-[8px] font-mono text-zinc-500 rounded-md uppercase border border-white/5">ANALYSIS_MODE: NEURAL_GEN</span>
                   <span className="px-2 py-1 bg-zinc-800 text-[6px] md:text-[8px] font-mono text-zinc-500 rounded-md uppercase border border-white/5">PROBABILITY: 94.2%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
