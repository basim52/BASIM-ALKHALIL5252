import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface SidebarItemProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function SidebarItem({ active, icon, label, onClick }: SidebarItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
        active ? 'text-indigo-600' : 'text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="active-nav" 
          className="absolute inset-0 bg-indigo-500/10 border-r-4 border-indigo-600 z-0" 
        />
      )}
      <span className={`relative z-10 ${active ? 'text-indigo-600' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
      <span className="relative z-10 hidden md:block font-display text-[12px] font-bold tracking-wide">{label}</span>
      {!active && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-indigo-600 rounded-l-full group-hover:h-4 transition-all duration-300" />
      )}
    </button>
  );
}

export function MiniStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-mono font-black uppercase tracking-[0.2em] text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-[1px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }} 
          className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${color}`} 
        />
      </div>
    </div>
  );
}
