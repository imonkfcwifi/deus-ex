
import React, { useEffect, useState } from 'react';
import { PendingDecision } from '../types';
import { audio } from '../services/audioService';
import { MessageCircle, X, Scroll, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';
import RichText from './RichText';

interface DecisionModalProps {
  decision: PendingDecision;
  keywords: string[]; // Expanded list
  onDecide: (optionId: string | null) => void;
  onLinkClick: (keyword: string) => void;
}

const TIMEOUT_SECONDS = 30;

const DecisionModal: React.FC<DecisionModalProps> = ({ decision, keywords, onDecide, onLinkClick }) => {
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIMEOUT_SECONDS - (elapsed / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDecide(null); // Auto-trigger silence
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onDecide]);

  const progressPercentage = (timeLeft / TIMEOUT_SECONDS) * 100;

  // Defensive: Ensure options is an array
  const safeOptions = Array.isArray(decision?.options) ? decision.options : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Container: max-height screen, flex column to handle overflow */}
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#1a1c23] border border-god-gold rounded-xl shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden transform transition-all scale-100">
        
        {/* Progress Bar (The Fuse) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 z-20">
            <motion.div 
                className="h-full bg-god-gold shadow-[0_0_10px_#D4AF37]"
                initial={{ width: '100%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
            />
        </div>

        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-god-gold/20 to-transparent pointer-events-none z-0" />
        
        {/* Scrollable Content Container */}
        <div className="relative z-10 p-6 md:p-8 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col items-center text-center">
            
            {/* Timer Display */}
            <div className="absolute top-2 right-4 text-[10px] font-mono text-god-gold/60 flex items-center gap-1">
                <Hourglass size={10} />
                <span>침묵까지 {Math.ceil(timeLeft)}초</span>
            </div>

            {/* Avatar / Icon */}
            <div className="mb-4 p-4 rounded-full bg-slate-900 border-2 border-god-gold/50 shadow-inner flex-shrink-0 mt-2">
                <MessageCircle className="w-8 h-8 text-god-gold" />
            </div>

            <div className="mb-2 flex-shrink-0">
                <h2 className="font-display text-xl md:text-2xl text-god-gold font-bold tracking-widest">{decision?.senderName || 'Unknown'}</h2>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">{decision?.senderRole || 'Prophet'}</p>
            </div>

            {/* The Petition */}
            <div className="my-6 relative flex-shrink-0 w-full">
                <Scroll className="absolute -top-4 -left-2 w-5 h-5 text-slate-600 opacity-20" />
                <p className="font-serif text-lg md:text-xl text-slate-200 italic leading-relaxed px-2">
                "<RichText content={decision?.message || '...'} keywords={keywords} onLinkClick={onLinkClick} />"
                </p>
                <Scroll className="absolute -bottom-4 -right-2 w-5 h-5 text-slate-600 opacity-20 transform rotate-180" />
            </div>

            {/* Choices */}
            <div className="w-full space-y-3 mt-2">
                {safeOptions.length > 0 ? (
                  safeOptions.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => { audio.playClick(); onDecide(opt.id); }}
                        onMouseEnter={() => audio.playHover()}
                        className="w-full group relative p-4 rounded-lg border border-slate-700 hover:border-god-gold hover:bg-slate-800 transition-all text-left overflow-hidden shrink-0"
                    >
                        <div className="relative z-10 flex flex-col">
                        <span className="font-sans font-bold text-slate-200 group-hover:text-god-gold transition-colors text-sm md:text-base">
                            <RichText content={opt.text} keywords={keywords} onLinkClick={onLinkClick} />
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-500 mt-1 group-hover:text-slate-400 font-serif italic">
                            ↳ 예지: {opt.consequenceHint}
                        </span>
                        </div>
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-god-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                   <div className="text-slate-500 text-xs italic">선택지가 보이지 않습니다. 침묵하십시오.</div>
                )}
            </div>

            {/* Ignore / Silence Option */}
            <div className="w-full mt-6 pt-6 border-t border-slate-800 flex-shrink-0">
                <button
                onClick={() => { audio.playClick(); onDecide(null); }}
                className="w-full py-2 text-slate-500 hover:text-slate-300 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group"
                >
                <X className="w-3 h-3 group-hover:text-red-400 transition-colors" />
                <span>기도를 무시하고 침묵하기 ({Math.ceil(timeLeft)}s)</span>
                </button>
                <p className="text-[10px] text-slate-600 mt-2">
                * 침묵 또한 신의 뜻으로 해석되어 역사에 기록됩니다.
                </p>
            </div>
            
            </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionModal;
