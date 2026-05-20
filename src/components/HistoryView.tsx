import { motion } from 'motion/react';
import { Database, RefreshCw, Sparkles, ChevronLeft } from 'lucide-react';

interface HistoryViewProps {
  history: any[];
  isSyncing: boolean;
  user: any;
  onSelect: (item: any) => void;
  onRefresh: () => void;
}

export function HistoryView({ history, isSyncing, user, onSelect, onRefresh }: HistoryViewProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
         <div className="text-center md:text-right w-full md:w-auto">
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-zinc-900 capitalize">الأرشيف السحابي</h2>
          <p className="text-zinc-500 font-mono text-[8px] md:text-[10px] uppercase tracking-widest mt-2 flex items-center justify-center md:justify-end gap-2">
            تمت المزامنة بنجاح <Database size={10} className="text-green-500 md:w-3 md:h-3" />
          </p>
         </div>
         <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
           {user && (
             <div className="flex md:flex flex-col items-center md:items-end justify-center px-4 md:border-r border-green-100">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">المستخدم المتصل</span>
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-900 truncate max-w-[200px] md:max-w-[150px]">{user.email || user.uid}</span>
             </div>
           )}
           <button 
             onClick={onRefresh}
             disabled={isSyncing}
             className="w-full md:w-auto p-4 bg-white border border-green-100 rounded-xl md:rounded-2xl hover:border-green-600 transition-all flex items-center justify-center gap-3 text-zinc-600 font-mono text-[10px] uppercase tracking-widest font-black active:scale-95 disabled:opacity-50"
           >
             {isSyncing ? <RefreshCw size={14} className="animate-spin text-green-600 md:w-4 md:h-4" /> : <RefreshCw size={14} className="md:w-4 md:h-4" />}
             تحديث الأرشيف
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {history.length > 0 ? history.map((item: any, i: number) => (
          <motion.div 
            key={item.id || i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(item)} 
            className="bg-white/80 border border-green-100 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] cursor-pointer hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/10 transition-all group relative overflow-hidden backdrop-blur-sm text-right"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-green-500/20 transition-colors" />
             
             <div className="flex justify-between items-start mb-4 md:mb-6 text-right">
               <span className="px-2 md:px-3 py-1 bg-zinc-900 text-white text-[7px] md:text-[8px] font-mono tracking-widest rounded-full uppercase">
                 {item.type === 'script' ? 'سيناريو' : item.type === 'prompt' ? 'مطالبة' : item.type === 'ideas' ? 'أفكار' : 'بيانات'}
               </span>
               <span className="text-[8px] md:text-[9px] font-mono text-zinc-400 font-bold" dir="ltr">
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('ar-SA') : item.date}
               </span>
             </div>
             
             <h4 className="text-zinc-900 text-lg md:text-xl font-black truncate group-hover:text-green-600 transition-colors mb-2 md:mb-3">{item.title || item.content?.title || 'توليد غير معنون'}</h4>
             <p className="text-zinc-500 text-[11px] md:text-xs line-clamp-2 leading-relaxed mb-4 md:mb-6 font-light">{item.description || item.content?.description || 'لا يوجد وصف متاح لهذا السجل.'}</p>
             
             <div className="flex items-center justify-between pt-4 border-t border-green-50/50">
                <div className="flex -space-x-1">
                   {[1,2,3].map(j => <div key={j} className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white bg-green-50 flex items-center justify-center"><Sparkles size={6} className="text-green-600 md:w-2 md:h-2" /></div>)}
                </div>
                <ChevronLeft size={16} className="text-zinc-300 group-hover:text-green-600 group-hover:translate-x-2 transition-all rotate-180" />
             </div>
          </motion.div>
        )) : (
          <div className="md:col-span-3 py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Database size={48} className="text-zinc-300" />
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-black">Archive_Status: Empty</p>
              <h3 className="text-2xl font-black text-zinc-900">الأرشيف السحابي فارغ</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto font-medium">إذا كنت متأكداً من وجود ملفات سابقة، يرجى محاولة الضغط على زر "تحديث الأرشيف" أو التأكد من تسجيل الدخول بنفس الحساب.</p>
            </div>
            {!user && (
              <p className="text-xs bg-red-50 text-red-600 p-2 rounded-lg inline-block font-bold">تنبيه: أنت لست مسجلاً للدخول الآن. الأرشيف يحتاج لحساب نشط.</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
