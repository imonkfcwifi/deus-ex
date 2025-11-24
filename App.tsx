import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LogEntry, WorldStats, Faction, PendingDecision, LogType, Person } from './types';
import { advanceSimulation, generatePortrait, initializeAI } from './services/geminiService';
import { audio } from './services/audioService';
import { storageService } from './services/storageService';
import { getThemeForVibe, FACTION_LORE_DATA, generateInitialPeople } from './constants';
import Chronicle from './components/Chronicle';
import WorldMap from './components/WorldMap';
import StatsPanel from './components/StatsPanel';
import DecisionModal from './components/DecisionModal';
import LoreModal from './components/LoreModal';
import StartScreen from './components/StartScreen';
import { Send, Hourglass, Play, Pause, Clock, Map as MapIcon, BookOpen, BarChart3, Volume2, VolumeX, Save, RotateCcw, AlertTriangle, ScrollText, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_STATS: WorldStats = {
  year: 1,
  population: 5000,
  technologicalLevel: "신화의 시대",
  culturalVibe: "여명",
  dominantReligion: "다신교"
};

const INITIAL_FACTIONS: Faction[] = [
  { name: "아우레아 성황청", power: 45, attitude: 80, tenets: ["신성 관료제", "절대 질서"], color: "#F59E0B", region: "Center" }, 
  { name: "침묵의 감시자들", power: 30, attitude: 10, tenets: ["엔트로피", "기록 보존"], color: "#06B6D4", region: "North" }, 
  { name: "유리 연금술 학회", power: 25, attitude: -10, tenets: ["물질 변환", "태양 숭배"], color: "#DC2626", region: "South" }, 
  { name: "강철뿌리 숲", power: 35, attitude: 30, tenets: ["생체 공학", "자연의 분노"], color: "#166534", region: "West" }, 
  { name: "심해 무역연합", power: 40, attitude: 50, tenets: ["실용주의", "심해 탐사"], color: "#3B82F6", region: "Coast" }, 
  { name: "공허의 직조공", power: 20, attitude: -50, tenets: ["허무주의", "천문학"], color: "#7C3AED", region: "East" } 
];

const SECONDS_PER_YEAR = 30;

type MobileTab = 'map' | 'chronicle' | 'stats';

const App: React.FC = () => {
  // Game State
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize state with defaults first
  const [stats, setStats] = useState<WorldStats>(INITIAL_STATS);
  const [factions, setFactions] = useState<Faction[]>(INITIAL_FACTIONS);
  const [figures, setFigures] = useState<Person[]>(generateInitialPeople()); // Initial figures from constants
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'init', year: 0, type: LogType.SYSTEM, content: "대지가 갈라지고 바다가 채워졌습니다. 여섯 개의 철학이 문명을 시작합니다." }
  ]);
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // New loading state for DB load
  
  const [isPlaying, setIsPlaying] = useState(false); // Default to false until loaded
  const [timerProgress, setTimerProgress] = useState(0);
  const [turnFlash, setTurnFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audio.isEnabled());
  const [isSaving, setIsSaving] = useState(false);
  
  // UI State
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [loreInitialFaction, setLoreInitialFaction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MobileTab>('map');
  
  const stateRef = useRef({ stats, factions, figures, logs, loading, pendingDecision, isPlaying });
  const wasPlayingRef = useRef(true);
  
  // Ref to track which figures are currently generating portraits to prevent duplicates
  const generatingPortraitsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    stateRef.current = { stats, factions, figures, logs, loading, pendingDecision, isPlaying };
  }, [stats, factions, figures, logs, loading, pendingDecision, isPlaying]);

  // Load Game Async
  const loadGameData = async () => {
      const savedGame = await storageService.loadGame();
      if (savedGame) {
        setStats(savedGame.stats);
        setFactions(savedGame.factions);
        setLogs(savedGame.logs);
        setPendingDecision(savedGame.pendingDecision);
        // Load figures if they exist, otherwise fallback to init
        if (savedGame.figures && savedGame.figures.length > 0) {
            setFigures(savedGame.figures);
        }
      }
      setIsInitializing(false);
      setIsPlaying(true); // Start game after load
  };

  // Audio Init on Interaction
  useEffect(() => {
    const unlockAudio = () => {
        audio.resume();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Autosave Effect
  useEffect(() => {
    if (!gameStarted || isInitializing) return; // Don't autosave while loading or before start

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      await storageService.saveGame(stats, factions, figures, logs, pendingDecision);
      setTimeout(() => setIsSaving(false), 1000);
    }, 1000); // Increased debounce to 1s

    return () => clearTimeout(timeoutId);
  }, [stats, factions, figures, logs, pendingDecision, isInitializing, gameStarted]);

  // Android Back Button Handling (Popstate)
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = (event: PopStateEvent) => {
      if (showLoreModal) {
          setShowLoreModal(false);
          setLoreInitialFaction(null);
          window.history.pushState(null, document.title, window.location.href);
      } else if (activeTab !== 'map') {
        setActiveTab('map');
        window.history.pushState(null, document.title, window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, showLoreModal]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { loading, pendingDecision, isPlaying } = stateRef.current;
      if (!gameStarted || !isPlaying || loading || pendingDecision) return;

      setTimerProgress(prev => {
        if (prev >= 100) {
          handleTurn(null, null, 5); 
          return 0;
        }
        return prev + (100 / (SECONDS_PER_YEAR * 10)); 
      });
    }, 100); 

    return () => clearInterval(interval);
  }, [gameStarted]);

  const toggleSound = () => {
      const enabled = audio.toggle();
      setSoundEnabled(enabled);
      if (enabled) audio.playClick();
  };

  const handleStartGame = () => {
      initializeAI(); // Try initialize with stored/env key if not already
      setGameStarted(true);
      loadGameData();
      audio.playTurnStart(); // Big thud for start
  };

  const handleResetGame = async () => {
    if (confirm("정말로 역사를 초기화하시겠습니까? 모든 기록이 사라집니다.")) {
      audio.playClick();
      await storageService.clearGame();
      window.location.reload();
    }
  };

  // --- Hyperlink & Keyword System ---
  const allKeywords = useMemo(() => {
    const factionNames = factions.map(f => f.name);
    const figureNames = figures.map(f => f.name);
    // Sort by length desc to match longest strings first in RichText
    return [...factionNames, ...figureNames].sort((a, b) => b.length - a.length);
  }, [factions, figures]);

  const handleLinkClick = (keyword: string) => {
    // Determine if keyword matches faction or person in LoreModal logic
    // Just pass the string name, LoreModal will resolve it
    setLoreInitialFaction(keyword);
    setShowLoreModal(true);
  };
  
  // Handler to generate portrait for a specific figure
  const handleGeneratePortrait = async (personId: string) => {
      const person = figures.find(f => f.id === personId);
      if (!person || person.portraitUrl || generatingPortraitsRef.current.has(personId)) return;

      generatingPortraitsRef.current.add(personId);
      
      try {
          const imageUrl = await generatePortrait(person);
          if (imageUrl) {
              setFigures(prev => prev.map(p => 
                  p.id === personId ? { ...p, portraitUrl: imageUrl } : p
              ));
          }
      } finally {
          generatingPortraitsRef.current.delete(personId);
      }
  };

  const handleTurn = async (playerCommand: string | null = null, decisionId: string | null = null, yearsToAdvance: number = 10) => {
    const currentState = stateRef.current;
    if (currentState.loading) return;
    
    if (playerCommand) audio.playSuccess();
    else audio.playTurnStart();

    setLoading(true);
    setPendingDecision(null);

    let currentLogs = [...currentState.logs];
    if (playerCommand) {
      const cmdLog: LogEntry = { 
        id: `cmd-${Date.now()}`, 
        year: currentState.stats.year, 
        type: LogType.CHAT, 
        content: `신의 명령: "${playerCommand}"` 
      };
      currentLogs.push(cmdLog);
      setLogs(currentLogs);
    }

    let decisionText = null;
    if (currentState.pendingDecision) {
        if (decisionId) {
            decisionText = currentState.pendingDecision.options.find(o => o.id === decisionId)?.text;
            audio.playClick();
        } else {
            decisionText = "IGNORE_SILENCE"; 
        }
    }

    const result = await advanceSimulation(
      currentState.stats, 
      currentState.factions,
      currentState.figures.filter(f => f.status === 'Alive'), // Only send alive figures to context
      currentLogs, 
      playerCommand, 
      decisionText,
      yearsToAdvance
    );

    setTurnFlash(true);
    setTimeout(() => setTurnFlash(false), 1000);

    setStats(prev => ({
      ...prev,
      ...result.stats,
      year: result.newYear,
      population: Math.max(0, prev.population + result.populationChange)
    }));
    
    setFactions(Array.isArray(result.factions) ? result.factions : []);
    
    // Merge Figures: Update existing, add new
    setFigures(prev => {
        const newMap = new Map(prev.map(p => [p.id, p]));
        result.updatedFigures.forEach(updated => {
            // Check if ID exists, or try to match by name for legacy continuity
            const existingId = updated.id; 
            const existingFigure = newMap.get(existingId);
            
            // Preserve portraitUrl if it exists
            const mergedFigure = {
                ...updated,
                portraitUrl: existingFigure?.portraitUrl || updated.portraitUrl
            };
            
            newMap.set(existingId, mergedFigure);
        });
        return Array.from(newMap.values());
    });

    setLogs(prev => [...prev, ...result.logs]);
    
    // Auto-Pause on Error to prevent loop
    const hasSystemError = result.logs.some(l => 
        l.type === LogType.SYSTEM && 
        (l.content.includes("429") || l.content.includes("403") || l.content.includes("시스템 과부하"))
    );

    if (hasSystemError) {
        setIsPlaying(false);
        audio.playClick(); // Alert sound
    } else if (result.pendingDecision) {
        setPendingDecision(result.pendingDecision);
        setIsPlaying(false); 
        audio.playDivinePresence();
    } else {
        setIsPlaying(true);
    }
    
    setLoading(false);
    setInput("");
    
    if (yearsToAdvance <= 5) {
        setTimerProgress(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) handleTurn(input, null, 1);
    }
  };

  const handleInputFocus = () => {
    wasPlayingRef.current = isPlaying;
    setIsPlaying(false);
  };

  const handleInputBlur = () => {
    if (wasPlayingRef.current) {
      setIsPlaying(true);
    }
  };

  const handleTabChange = (tab: MobileTab) => {
      audio.playClick();
      setActiveTab(tab);
  }

  const currentTheme = getThemeForVibe(stats.culturalVibe);

  if (!gameStarted) {
      return <StartScreen onStart={handleStartGame} />;
  }

  return (
    <div 
      className="fixed inset-0 w-full h-full text-god-text flex flex-col md:flex-row overflow-hidden font-sans select-none divine-bg relative transition-colors duration-1000"
      style={{
        '--theme-primary': currentTheme.colors.primary,
        '--theme-dim': currentTheme.colors.dim,
        '--theme-accent': currentTheme.colors.accent,
        '--theme-bg-start': currentTheme.colors.bgStart,
        '--theme-bg-end': currentTheme.colors.bgEnd,
        '--font-display': currentTheme.fontDisplay,
      } as React.CSSProperties}
    >
      
      <AnimatePresence>
        {/* Full Screen Loading Overlay Removed - Replaced with Header Indicator */}
        {turnFlash && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-[70] bg-white mix-blend-overlay pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="hidden md:block w-1/3 lg:w-[28%] h-full z-10 relative shadow-[10px_0_30px_rgba(0,0,0,0.3)] glass-panel border-r-0 border-r-white/5 transition-all duration-1000">
        <Chronicle logs={logs} keywords={allKeywords} onLinkClick={handleLinkClick} />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-2">
              <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2 md:px-6 md:py-3 shadow-xl transition-all flex items-center gap-4">
                  <div>
                    <h1 className="font-display text-lg md:text-2xl text-god-gold tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-colors duration-1000 leading-none">
                        DEUS EX
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] md:text-xs text-slate-400 font-serif">
                        <span className="text-god-gold/80 uppercase tracking-widest truncate max-w-[80px] md:max-w-none transition-colors duration-1000">{stats.technologicalLevel}</span>
                        <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className="hidden md:inline italic">{stats.culturalVibe}</span>
                    </div>
                  </div>

                  {/* Non-intrusive Loading Indicator */}
                  <AnimatePresence>
                    {(loading || isInitializing) && (
                        <motion.div 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-2 px-3 py-1 bg-god-gold/10 rounded-full border border-god-gold/20 overflow-hidden"
                        >
                            <PenTool size={12} className="text-god-gold animate-bounce" />
                            <span className="text-[10px] text-god-gold font-mono whitespace-nowrap animate-pulse">
                                {isInitializing ? "RESURRECTING..." : "WRITING HISTORY..."}
                            </span>
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {isSaving && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur rounded-full border border-white/5 self-start"
                  >
                    <Save size={10} className="text-slate-400 animate-pulse" />
                    <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Autosaving...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="pointer-events-auto flex flex-col items-end gap-2 md:gap-3">
                <div className="flex items-center gap-3 bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-full pl-4 pr-2 py-1.5 shadow-xl">
                    <div className="flex flex-col items-end mr-2">
                         <div className="text-[9px] md:text-[10px] text-slate-500 uppercase font-mono tracking-widest">Year</div>
                         <div className="text-xl md:text-2xl font-display font-bold text-slate-200 leading-none">{stats.year}</div>
                    </div>
                    
                    <button 
                        onClick={() => { audio.playClick(); setShowLoreModal(true); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-800 text-slate-500 hover:text-god-gold hover:border-god-gold/50 transition-all duration-300"
                        title="World Lore"
                    >
                         <ScrollText size={14} />
                    </button>

                    <button 
                        onClick={handleResetGame}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-800 text-slate-600 hover:text-red-400 hover:border-red-900/50 transition-all duration-300"
                        title="Reset World"
                    >
                         <RotateCcw size={14} />
                    </button>

                    <button 
                        onClick={toggleSound}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${soundEnabled ? 'text-slate-300 border-slate-600 hover:text-white' : 'text-slate-600 border-slate-800'}`}
                    >
                         {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>

                    <button 
                        onClick={() => { audio.playClick(); setIsPlaying(!isPlaying); }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-lg ${isPlaying ? 'bg-god-gold/10 border-god-gold text-god-gold shadow-[0_0_15px_rgba(0,0,0,0.2)]' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full border border-white/5 backdrop-blur-sm">
                    <Clock size={10} className="text-slate-500"/>
                    <div className="w-16 md:w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-god-gold shadow-[0_0_8px_currentColor]"
                            animate={{ width: `${timerProgress}%` }}
                            transition={{ ease: "linear", duration: 0.1 }}
                            style={{ backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.primary }}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
            
            <div className="hidden md:flex h-full p-6 pt-28 pb-32 gap-6">
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-god-gold/20 shadow-2xl group transition-all duration-1000 hover:border-god-gold/40">
                    <div className="absolute inset-0 bg-slate-900 z-0" />
                    <WorldMap factions={factions || []} culturalVibe={stats.culturalVibe} />
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-god-gold/50 rounded-tl-xl pointer-events-none z-20 transition-colors duration-1000" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-god-gold/50 rounded-tr-xl pointer-events-none z-20 transition-colors duration-1000" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-god-gold/50 rounded-bl-xl pointer-events-none z-20 transition-colors duration-1000" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-god-gold/50 rounded-br-xl pointer-events-none z-20 transition-colors duration-1000" />
                </div>
                
                <div className="w-80 flex-shrink-0 flex flex-col gap-6 h-full">
                   <StatsPanel stats={stats} factions={factions || []} />
                </div>
            </div>

            <div className="md:hidden w-full h-full pb-[150px] pt-[80px] relative"> 
                <AnimatePresence mode="wait">
                    {activeTab === 'map' && (
                        <motion.div 
                            key="map"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-full h-full relative"
                        >
                            <WorldMap factions={factions || []} culturalVibe={stats.culturalVibe} />
                        </motion.div>
                    )}
                    {activeTab === 'chronicle' && (
                         <motion.div 
                            key="chronicle"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="w-full h-full px-2"
                        >
                            <div className="h-full rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                                <Chronicle logs={logs || []} keywords={allKeywords} onLinkClick={handleLinkClick} />
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'stats' && (
                        <motion.div 
                            key="stats"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="w-full h-full p-4 overflow-y-auto scrollbar-hide"
                        >
                            <StatsPanel stats={stats} factions={factions || []} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
        </div>

        <div className={`
            absolute left-0 right-0 z-40 px-4 pt-0 md:p-6 transition-all duration-500 
            bottom-[calc(75px+env(safe-area-inset-bottom))] pb-4 md:pb-6 md:bottom-6 md:w-full md:left-0
        `}>
            <div className={`
                max-w-2xl mx-auto relative group transition-all duration-300
                ${input ? 'scale-105 -translate-y-2' : 'scale-100'}
            `}>
                <div 
                    className={`absolute -inset-1 bg-gradient-to-r from-transparent via-god-gold/20 to-transparent rounded-2xl blur-xl transition-all duration-500 ${input ? 'opacity-100' : 'opacity-0'}`} 
                    style={{ '--tw-gradient-via': 'var(--theme-primary)' } as React.CSSProperties}
                />
                
                <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-god-gold/30 rounded-2xl shadow-2xl overflow-hidden group-focus-within:border-god-gold group-focus-within:shadow-[0_0_30px_rgba(0,0,0,0.15)] transition-all duration-500">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={loading ? "역사가 쓰여지는 중..." : "신탁을 내려 역사에 개입하십시오..."}
                        disabled={loading}
                        className="w-full bg-transparent px-4 md:px-6 py-3 md:py-4 text-slate-100 placeholder-slate-500 focus:outline-none font-serif text-base md:text-lg tracking-wide disabled:opacity-50"
                    />
                    <button 
                        onClick={() => input.trim() && handleTurn(input, null, 1)}
                        disabled={!input.trim() || loading}
                        className="p-4 text-god-gold hover:text-white disabled:opacity-30 transition-colors relative"
                    >
                         {loading ? <Hourglass className="animate-spin-slow" /> : <Send />}
                    </button>
                    
                    <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-god-gold to-transparent transition-all duration-500 ${input ? 'w-full opacity-100' : 'w-0 opacity-0 left-1/2'}`} />
                </div>
            </div>
        </div>
        
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)] pt-2 h-[calc(70px+env(safe-area-inset-bottom))] transition-colors duration-1000">
             <button 
                onClick={() => handleTabChange('chronicle')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chronicle' ? 'text-god-gold scale-110' : 'text-slate-500'}`}
             >
                 <BookOpen size={20} strokeWidth={activeTab === 'chronicle' ? 2.5 : 1.5} />
                 <span className="text-[10px] font-display tracking-widest">LOGS</span>
             </button>

             <button 
                onClick={() => handleTabChange('map')}
                className={`flex flex-col items-center gap-1 transition-all -translate-y-4 bg-slate-900/50 p-3 rounded-full border border-white/10 ${activeTab === 'map' ? 'text-god-gold border-god-gold shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-110' : 'text-slate-500'}`}
                style={activeTab === 'map' ? { color: currentTheme.colors.primary, borderColor: currentTheme.colors.primary, boxShadow: `0 0 15px ${currentTheme.colors.primary}40` } : {}}
             >
                 <MapIcon size={24} strokeWidth={activeTab === 'map' ? 2.5 : 1.5} />
             </button>

             <button 
                onClick={() => handleTabChange('stats')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-god-gold scale-110' : 'text-slate-500'}`}
             >
                 <BarChart3 size={20} strokeWidth={activeTab === 'stats' ? 2.5 : 1.5} />
                 <span className="text-[10px] font-display tracking-widest">STATS</span>
             </button>
        </div>

      </div>

      <AnimatePresence>
        {pendingDecision && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <DecisionModal 
                    decision={pendingDecision} 
                    keywords={allKeywords}
                    onDecide={(id) => handleTurn(null, id, 5)} 
                    onLinkClick={handleLinkClick}
                />
            </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showLoreModal && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-50"
            >
                <LoreModal 
                    factions={factions || []} 
                    figures={figures}
                    logs={logs}
                    keywords={allKeywords}
                    initialFaction={loreInitialFaction}
                    onClose={() => {
                      setShowLoreModal(false);
                      setLoreInitialFaction(null);
                    }}
                    onLinkClick={handleLinkClick}
                    onRequestPortrait={handleGeneratePortrait}
                />
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;