
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogType, Faction } from '../types';
import { audio } from '../services/audioService';
import { Book, Copy, Check, Feather, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from './RichText';

interface ChronicleProps {
  logs: LogEntry[];
  keywords: string[]; // Changed from factions to generic keywords
  onLinkClick: (keyword: string) => void;
}

const Chronicle: React.FC<ChronicleProps> = ({ logs, keywords, onLinkClick }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopy = () => {
    audio.playClick();
    const textHistory = logs.map(log => {
      let prefix = `[AD ${log.year}]`;
      if (log.type === LogType.SCRIPTURE) prefix += ` [성서]`;
      return `${prefix} ${log.content}`;
    }).join('\n\n');

    navigator.clipboard.writeText(textHistory).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0B101B]/95 backdrop-blur-md relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }}></div>

      {/* Header */}
      <div className="relative z-10 p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#0F172A] to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-god-gold/10 border border-god-gold/20">
             <Book className="w-4 h-4 text-god-gold" />
          </div>
          <div>
            <h2 className="font-display text-god-gold text-lg tracking-[0.15em] leading-none">CHRONICLES</h2>
            <div className="text-[10px] text-slate-500 font-serif italic mt-1">The history of the world</div>
          </div>
        </div>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-god-gold transition-colors"
          title="기록 전체 복사"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
      </div>
      
      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide relative z-10">
        {logs.length === 0 && (
          <div className="text-slate-500 text-center italic mt-20 font-serif opacity-50">
            <Feather className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>페이지가 비어있습니다.<br/>아직 시간이 흐르지 않았습니다.</p>
          </div>
        )}
        
        {logs.map((log, index) => {
          const isLatest = index === logs.length - 1 && logs.length > 1;
          
          return (
            <motion.div 
                key={log.id} 
                layout
                initial={{ opacity: 0, x: -10, filter: "blur(2px)" }}
                animate={{ 
                    opacity: 1, 
                    x: 0, 
                    filter: "blur(0px)",
                    textShadow: isLatest ? "0 0 10px rgba(212, 175, 55, 0.5)" : "none"
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`flex flex-col group`}
            >
                <div className="flex items-center gap-3 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="h-px w-4 bg-slate-600"></div>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">{log.year}년</span>
                <div className="h-px flex-1 bg-slate-800"></div>
                {log.type === LogType.SCRIPTURE && (
                    <span className="text-[9px] uppercase tracking-widest text-god-gold border border-god-gold/30 px-1.5 py-0.5 rounded bg-god-gold/5">Scripture</span>
                )}
                </div>

                {/* Optional Image */}
                {log.imageUrl && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="pl-6 mb-3"
                    >
                        <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl group-image">
                            <img src={log.imageUrl} alt="Historical depiction" className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60"></div>
                            <div className="absolute bottom-2 right-2 text-[9px] text-slate-400 bg-black/50 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1">
                                <ImageIcon size={10} />
                                <span>Divine Vision</span>
                            </div>
                        </div>
                    </motion.div>
                )}
                
                {log.type === LogType.SCRIPTURE ? (
                <div className="relative pl-6 py-2">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-god-gold to-transparent opacity-60"></div>
                    <motion.p 
                        animate={isLatest ? { color: ["#fff", "#D4AF37"] } : {}}
                        transition={{ duration: 1.5 }}
                        className="font-serif text-xl text-god-gold italic leading-relaxed drop-shadow-md"
                    >
                    "<RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />"
                    </motion.p>
                    {log.flavor && <p className="text-xs text-slate-500 text-right mt-2 font-serif tracking-wide">— {log.flavor}</p>}
                </div>
                ) : log.type === LogType.HISTORICAL ? (
                <div className="pl-6 border-l border-slate-700/50 py-1">
                    <motion.p 
                        initial={isLatest ? { color: "#ffffff" } : {}}
                        animate={{ color: "#cbd5e1" }} // slate-300
                        transition={{ duration: 2 }}
                        className="font-serif leading-7 text-[15px]"
                    >
                    <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                    </motion.p>
                </div>
                ) : log.type === LogType.CULTURAL ? (
                <div className="pl-6 border-l border-purple-500/20 py-1 bg-gradient-to-r from-purple-900/10 to-transparent rounded-r-lg">
                    <p className="font-sans text-sm text-purple-200 italic font-light">
                    <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                    </p>
                </div>
                ) : log.type === LogType.CHAT ? (
                <div className="pl-6 border-l border-white/20 py-1">
                    <p className="font-sans text-sm text-slate-400">
                    <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                    </p>
                </div>
                ) : (
                <div className="bg-slate-900/50 p-3 rounded border border-slate-800 font-mono text-[11px] text-green-500/80">
                     <span className="opacity-70 mr-2">&gt; SYSTEM:</span>
                     <RichText content={log.content} keywords={keywords} onLinkClick={onLinkClick} />
                </div>
                )}
            </motion.div>
          );
        })}
        <div ref={bottomRef} className="h-10" />
      </div>
    </div>
  );
};

export default Chronicle;
