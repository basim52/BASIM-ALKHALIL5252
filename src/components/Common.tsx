import { ReactNode } from 'react';
import { Copy } from 'lucide-react';

interface ContentBlockProps {
  label: string;
  content: string;
  onCopy: (text: string) => void;
  big?: boolean;
}

export function ContentBlock({ label, content, onCopy, big }: ContentBlockProps) {
  return (
    <div className="bg-white border border-green-100 p-8 rounded-3xl space-y-4 group shadow-sm transition-all hover:shadow-md text-right">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{label}</label>
        <button onClick={() => onCopy(content)} className="p-2 hover:bg-green-50 rounded-lg text-zinc-300 hover:text-green-600 transition-all">
          <Copy size={16} />
        </button>
      </div>
      <p className={`${big ? 'text-2xl font-bold text-zinc-900' : 'text-zinc-600 font-light'} leading-relaxed`}>{content}</p>
    </div>
  );
}

export function ActionButton({ icon, onClick, label }: { icon: ReactNode, onClick: () => void, label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-6 py-3 bg-white border border-green-100 hover:border-green-600 rounded-xl transition-all group shadow-sm">
       <span className="group-hover:text-green-600 transition-colors text-zinc-400">{icon}</span>
       <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600 font-bold">{label}</span>
    </button>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 bg-white border border-green-100 rounded-lg text-xs font-mono text-zinc-500 uppercase tracking-widest group-hover:border-green-600 transition-colors shadow-sm">
      {label}
    </span>
  );
}
