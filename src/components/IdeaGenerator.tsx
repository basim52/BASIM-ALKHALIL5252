import { motion } from 'motion/react';
import { Lightbulb, Copy, Check, Sparkles, Download, FileText, Table } from 'lucide-react';
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

interface IdeaGeneratorProps {
  ideas: string[];
  onGenerate: (count: number) => void;
  onUseIdea: (idea: string) => void;
  isLoading: boolean;
}

export function IdeaGenerator({ ideas, onGenerate, onUseIdea, isLoading }: IdeaGeneratorProps) {
  const [count, setCount] = useState(5);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const ideasRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportToExcel = () => {
    if (ideas.length === 0) return;
    
    // Create data with numbers on the right since it's Arabic
    const data = ideas.map((idea, index) => ({
      'الموضوع': idea,
      'الرقم': index + 1
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Set Right-to-Left property for the sheet
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "الأفكار");
    
    // Setting column width
    worksheet['!cols'] = [{ wch: 100 }, { wch: 10 }];
    
    XLSX.writeFile(workbook, `ideas_${Date.now()}.xlsx`);
  };

  const exportToPDF = async () => {
    if (ideas.length === 0 || !ideasRef.current) return;

    try {
      // We use html2canvas because standard PDF libraries struggle with Arabic fonts/RTL 
      // without embedding external .ttf files. This captures exactly what the user sees.
      const canvas = await html2canvas(ideasRef.current, {
        scale: 2, // Better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: ideasRef.current.scrollWidth,
        windowHeight: ideasRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`ideas_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-green-100 p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 text-right w-full lg:w-auto">
            <h3 className="text-2xl font-black text-zinc-900 flex items-center gap-3 justify-end">
              مولد الأفكار الذكي <Lightbulb className="text-yellow-500" />
            </h3>
            <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">قم بتحديد عدد الأفكار المطلوبة وسأقوم بتوليدها لك</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-zinc-50 p-2 rounded-2xl w-full lg:w-auto">
            <div className="flex items-center gap-3 px-4">
              <input 
                type="number" 
                min="1" 
                max="40" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-16 bg-transparent border-none text-center font-black text-green-600 focus:ring-0 text-xl"
              />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">عدد الأفكار</span>
            </div>
            <button 
              onClick={() => onGenerate(count)}
              disabled={isLoading}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
              توليد الآن
            </button>
          </div>
        </div>

        {ideas.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-100">
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-white border border-green-100 rounded-lg text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2"
            >
              <Table size={14} /> تصدير Excel
            </button>
            <button 
              onClick={exportToPDF}
              className="px-4 py-2 bg-white border border-green-100 rounded-lg text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2 group"
            >
              <FileText size={14} /> تصدير PDF (عالي الجودة)
            </button>
          </div>
        )}
      </div>

      <div ref={ideasRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 -m-4 bg-transparent rounded-[2rem]">
        {ideas.map((idea, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white border border-green-100 p-6 rounded-3xl hover:border-green-500 transition-all shadow-sm hover:shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-green-50 rounded-bl-2xl flex items-center justify-center text-[10px] font-mono font-bold text-green-600">
              {index + 1}
            </div>
            <p className="text-right text-zinc-700 leading-relaxed font-medium pt-2 pr-6">
              {idea}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => onUseIdea(idea)}
                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all flex items-center gap-2"
              >
                توليد سيناريو <Sparkles size={12} />
              </button>
              <button 
                onClick={() => handleCopy(idea, index)}
                className="p-2 text-zinc-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              >
                {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </motion.div>
        ))}
        
        {ideas.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center space-y-4 bg-zinc-50/50 rounded-[3rem] border border-dashed border-zinc-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Lightbulb className="text-zinc-300" size={32} />
            </div>
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">أدخل موضوعاً في الأعلى واطلب أفكاراً لتبدأ</p>
          </div>
        )}
      </div>
    </div>
  );
}
