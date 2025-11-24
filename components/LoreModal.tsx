
import React, { useState, useMemo, useEffect } from 'react';
import { Faction, LogEntry, Person } from '../types';
import { FACTION_LORE_DATA } from '../constants';
import { audio } from '../services/audioService';
import { X, BookOpen, Book, Scroll, Users, MessageSquare, Shield, History, Skull, AlertCircle, TrendingUp, TrendingDown, Crown, User, Star, Cross, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from './RichText';

interface LoreModalProps {
  factions: Faction[];
  figures: Person[];
  logs: LogEntry[];
  keywords: string[]; // Expanded list
  initialFaction?: string | null;
  onClose: () => void;
  onLinkClick: (keyword: string) => void;
  onRequestPortrait: (personId: string) => void;
}

const LoreModal: React.FC<LoreModalProps> = ({ factions, figures, logs, keywords, initialFaction, onClose, onLinkClick, onRequestPortrait }) => {
  const [selectedFactionName, setSelectedFactionName] = useState<string | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lore' | 'history'>('lore');

  // Initialization Logic: linking input string to either a faction or a person
  useEffect(() => {
    if (initialFaction) {
        // Check if it matches a faction
        const isFaction = factions.some(f => f.name === initialFaction);
        if (isFaction) {
            setSelectedFactionName(initialFaction);
            setSelectedFigureId(null);
        } else {
            // Check if it matches a person (initialFaction here is just a name string passed from onLinkClick)
            const person = figures.find(p => p.name === initialFaction);
            if (person) {
                setSelectedFigureId(person.id);
                setSelectedFactionName(person.factionName);
            } else {
                // Fallback to faction if no person found but maybe it was a faction name?
                setSelectedFactionName(initialFaction);
            }
        }
    } else if (!selectedFactionName && factions.length > 0) {
        setSelectedFactionName(factions[0].name);
    }
  }, [initialFaction, factions, figures]);

  const selectedFaction = factions.find(f => f.name === selectedFactionName);
  const selectedFigure = figures.find(p => p.id === selectedFigureId);
  
  // Trigger portrait generation if viewing a figure without one
  useEffect(() => {
      if (selectedFigure && !selectedFigure.portraitUrl) {
          onRequestPortrait(selectedFigure.id);
      }
  }, [selectedFigure, onRequestPortrait]);
  
  // If we have a selected figure, we override the faction data display to show person profile
  const isPersonView = !!selectedFigure;
  const loreData = selectedFactionName ? FACTION_LORE_DATA[selectedFactionName] : null;

  // Filter out the currently selected name from keywords to avoid self-linking
  const availableKeywords = useMemo(() => {
    const currentName = selectedFigure ? selectedFigure.name : selectedFactionName;
    return keywords.filter(k => k !== currentName);
  }, [keywords, selectedFigure, selectedFactionName]);

  // Dynamic History: Filter logs
  const factionHistory = useMemo(() => {
    if (!selectedFactionName) return [];
    return logs.filter(log => log.content.includes(selectedFactionName));
  }, [selectedFactionName, logs]);

  const personHistory = useMemo(() => {
      if (!selectedFigure) return [];
      // Filter logs containing the person's name
      return logs.filter(log => log.content.includes(selectedFigure.name));
  }, [selectedFigure, logs]);

  const handleSelectFaction = (name: string) => {
    audio.playClick();
    setSelectedFactionName(name);
    setSelectedFigureId(null); // Clear person selection
    setActiveTab('lore');
  };

  const handleSelectFigure = (person: Person) => {
    audio.playClick();
    setSelectedFigureId(person.id);
    setSelectedFactionName(person.factionName); // Ensure sidebar highlights correct faction
  };

  const handleClose = () => {
    audio.playClick();
    onClose();
  };
  
  const isFallen = selectedFaction ? selectedFaction.power <= 0 : false;

  const getDynamicStatus = (f: Faction) => {
    if (f.power <= 0) return { text: "이 세력은 역사의 뒤안길로 사라졌으며, 이제는 폐허와 기록으로만 남아있습니다.", icon: Skull, color: "text-slate-500" };
    if (f.power >= 80) return { text: "현재 이 세력은 대륙을 호령하는 절대적인 지배자로서 전성기를 누리고 있습니다.", icon: Crown, color: "text-god-gold" };
    if (f.power >= 50) return { text: "강력한 영향력을 행사하며 문명의 주축을 담당하고 있습니다.", icon: TrendingUp, color: "text-blue-400" };
    if (f.power <= 20) return { text: "쇠락의 길을 걷고 있으며, 존망의 위기에 처해 있습니다.", icon: TrendingDown, color: "text-red-400" };
    return { text: "자신들의 영토에서 묵묵히 역사를 써내려가고 있습니다.", icon: Shield, color: "text-slate-400" };
  };

  const dynamicStatus = selectedFaction ? getDynamicStatus(selectedFaction) : null;

  // Combine figures: Existing ones from state + static ones from lore data that might not be in state yet (legacy support)
  const factionFigures = useMemo(() => {
      if (!selectedFactionName) return [];
      return figures.filter(f => f.factionName === selectedFactionName);
  }, [selectedFactionName, figures]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0f172a] border border-god-gold/30 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Header (Mobile Only) */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2 text-god-gold">
            <Book size={18} />
            <span className="font-display font-bold">Archives</span>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar: Faction List */}
        <div className="w-full md:w-1/4 bg-slate-900/50 border-r border-white/5 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-white/5 hidden md:flex justify-between items-center">
             <div className="flex items-center gap-2 text-god-gold">
                <BookOpen size={20} />
                <h2 className="font-display text-xl font-bold tracking-widest">ARCHIVES</h2>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {factions.map((faction) => (
              <button
                key={faction.name}
                onClick={() => handleSelectFaction(faction.name)}
                className={`w-full text-left p-3 rounded-lg transition-all border flex items-center justify-between group relative overflow-hidden
                  ${selectedFactionName === faction.name && !selectedFigureId
                    ? 'bg-god-gold/10 border-god-gold/50 text-god-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div 
                    className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${faction.power <= 0 ? 'bg-slate-700 text-slate-700' : ''}`}
                    style={faction.power > 0 ? { backgroundColor: faction.color, color: faction.color } : {}} 
                  />
                  <span className={`font-serif text-sm ${selectedFactionName === faction.name ? 'font-bold' : ''} ${faction.power <= 0 ? 'line-through opacity-50' : ''}`}>
                    {faction.name}
                  </span>
                </div>
                {faction.power <= 0 && <Skull size={14} className="text-slate-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gradient-to-br from-[#0f172a] to-[#020617] relative flex flex-col h-full overflow-hidden">
            <button 
                onClick={handleClose}
                className="hidden md:block absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
            >
                <X size={24} />
            </button>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                    
                    {/* --- VIEW 1: PERSON PROFILE --- */}
                    {isPersonView && selectedFigure ? (
                         <motion.div
                            key="person-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="p-6 md:p-10"
                        >
                            <button 
                                onClick={() => setSelectedFigureId(null)}
                                className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-god-gold transition-colors"
                            >
                                ← Back to {selectedFactionName}
                            </button>

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Profile Card */}
                                <div className="w-full md:w-1/3 flex flex-col gap-4">
                                    <div className="aspect-[3/4] bg-slate-900 rounded-xl border border-white/10 relative overflow-hidden shadow-2xl group">
                                         {/* Portrait Logic */}
                                         {selectedFigure.portraitUrl ? (
                                             <motion.img 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                src={selectedFigure.portraitUrl} 
                                                alt={selectedFigure.name}
                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105"
                                             />
                                         ) : (
                                             <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center gap-3">
                                                 <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                                 >
                                                    <Loader2 size={40} className="text-god-gold opacity-50" />
                                                 </motion.div>
                                                 <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Painting Portrait...</span>
                                             </div>
                                         )}

                                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                         
                                         <div className="absolute bottom-4 left-4 right-4">
                                            <h2 className="text-2xl font-display font-bold text-slate-100 leading-tight drop-shadow-lg">{selectedFigure.name}</h2>
                                            <p className="text-god-gold font-serif italic text-sm">{selectedFigure.role}</p>
                                         </div>

                                         {selectedFigure.status === 'Dead' && (
                                            <div className="absolute top-4 right-4 bg-red-900/80 text-red-100 text-[10px] font-bold px-2 py-1 rounded border border-red-500/30 uppercase tracking-widest">
                                                Deceased
                                            </div>
                                         )}
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Allegiance</span>
                                            <span className="text-slate-300 font-bold">{selectedFigure.factionName}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Birth</span>
                                            <span className="text-slate-300">{selectedFigure.birthYear > 0 ? `Year ${selectedFigure.birthYear}` : 'Pre-History'}</span>
                                        </div>
                                        {selectedFigure.deathYear && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Death</span>
                                                <span className="text-red-400">Year {selectedFigure.deathYear}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                            {selectedFigure.traits.map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 border border-white/5">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Biography & Timeline */}
                                <div className="flex-1 space-y-8">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                            <Scroll size={18} />
                                            <span>Biography</span>
                                        </h3>
                                        <div className="prose prose-invert max-w-none">
                                            <p className="text-slate-300 font-serif leading-relaxed text-lg italic opacity-90">
                                                "{selectedFigure.description}"
                                            </p>
                                            <p className="text-slate-400 font-sans text-sm leading-relaxed mt-4 whitespace-pre-wrap">
                                                <RichText content={selectedFigure.biography} keywords={availableKeywords} onLinkClick={onLinkClick} />
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                            <History size={18} />
                                            <span>Life Chronicle</span>
                                        </h3>
                                        <div className="space-y-4 pl-2 border-l border-white/10">
                                            {personHistory.length > 0 ? (
                                                personHistory.map(log => (
                                                    <div key={log.id} className="relative pl-6">
                                                        <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600"></div>
                                                        <div className="text-xs font-mono text-slate-500 mb-1">Year {log.year}</div>
                                                        <p className="text-sm text-slate-300 leading-relaxed">
                                                            <RichText content={log.content} keywords={availableKeywords} onLinkClick={onLinkClick} />
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-slate-600 italic text-sm pl-6">No specific historical records found yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    /* --- VIEW 2: FACTION LORE (Default) --- */
                    ) : selectedFaction && loreData ? (
                        <motion.div
                            key={selectedFaction.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                        >
                            {/* Fallen Stamp */}
                            {isFallen && (
                              <div className="absolute top-10 right-10 pointer-events-none opacity-40 z-0 select-none">
                                <div className="border-4 border-red-900/50 text-red-900/50 font-display font-bold text-6xl uppercase tracking-widest p-4 -rotate-12">
                                  FALLEN
                                </div>
                              </div>
                            )}

                            {/* Faction Header (Sticky) */}
                            <div className="sticky top-0 z-10 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 p-6 md:p-10 pb-6 flex flex-col items-center text-center">
                                <div 
                                    className="w-16 h-16 rounded-full mb-4 flex items-center justify-center shadow-[0_0_30px_currentColor] bg-black/40 border border-white/10 relative transition-colors duration-500"
                                    style={{ color: isFallen ? '#475569' : selectedFaction.color }}
                                >
                                    {isFallen ? <Skull size={32} /> : <Shield size={32} />}
                                </div>
                                <h2 className="text-3xl font-display font-bold text-slate-100 mb-2 relative">
                                  {selectedFaction.name}
                                </h2>
                                
                                {/* Live Stats */}
                                <div className="flex gap-6 mt-4 p-3 bg-slate-900/50 rounded-xl border border-white/5 shadow-inner">
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Power</div>
                                        <div className={`text-xl font-display ${isFallen ? 'text-slate-600' : 'text-god-gold'}`}>
                                          {selectedFaction.power}
                                        </div>
                                    </div>
                                    <div className="w-px bg-white/10"></div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Faith</div>
                                        <div className={`text-xl font-display ${selectedFaction.attitude >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                            {selectedFaction.attitude}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex mt-6 gap-2 p-1 bg-slate-900/80 rounded-lg border border-white/5">
                                  <button 
                                    onClick={() => { audio.playClick(); setActiveTab('lore'); }}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'lore' ? 'bg-god-gold text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                  >
                                    Lore & Figures
                                  </button>
                                  <button 
                                    onClick={() => { audio.playClick(); setActiveTab('history'); }}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-god-gold text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                  >
                                    Chronicles ({factionHistory.length})
                                  </button>
                                </div>
                            </div>

                            <div className="p-6 md:p-10 pt-6">
                              {activeTab === 'lore' ? (
                                <div className="space-y-8 animate-fade-in">
                                    {/* Dynamic Status Section */}
                                    {dynamicStatus && (
                                      <div className={`bg-white/5 p-4 rounded-lg border border-white/5 flex gap-3 items-start ${isFallen ? 'opacity-75 grayscale' : ''}`}>
                                          <dynamicStatus.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dynamicStatus.color}`} />
                                          <p className="font-serif italic text-slate-200 text-base leading-relaxed">
                                            "{dynamicStatus.text}"
                                          </p>
                                      </div>
                                    )}

                                    {/* Description */}
                                    <div className="prose prose-invert">
                                        <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                            <Scroll size={18} />
                                            <span>기원과 역사</span>
                                        </h3>
                                        <p className="text-slate-300 font-serif leading-relaxed text-lg italic opacity-90">
                                            "{loreData.description}"
                                        </p>
                                        <p className="text-slate-400 font-sans text-sm leading-relaxed mt-4">
                                            <RichText content={loreData.history} keywords={availableKeywords} onLinkClick={onLinkClick} />
                                        </p>
                                    </div>

                                    {/* Beliefs */}
                                    <div>
                                        <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                            <MessageSquare size={18} />
                                            <span>현재의 교리와 신념</span>
                                        </h3>
                                        <ul className="space-y-3">
                                            {selectedFaction.tenets.map((tenet, idx) => (
                                                <li key={`tenet-${idx}`} className="flex gap-3 text-white font-serif items-start">
                                                    <span className="text-blue-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 shadow-[0_0_5px_currentColor]" />
                                                    <span className="font-semibold text-blue-100">
                                                      [현재의 기조] <RichText content={tenet} keywords={availableKeywords} onLinkClick={onLinkClick} />
                                                    </span>
                                                </li>
                                            ))}
                                            {loreData.beliefs.map((belief, idx) => (
                                                <li key={`belief-${idx}`} className="flex gap-3 text-slate-400 font-serif items-start">
                                                    <span className="text-god-gold/50 mt-1.5 w-1.5 h-1.5 rounded-full bg-god-gold/50 flex-shrink-0" />
                                                    <span>"<RichText content={belief} keywords={availableKeywords} onLinkClick={onLinkClick} />"</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Key Figures Grid */}
                                    <div>
                                        <h3 className="flex items-center gap-2 text-god-gold font-display text-lg mb-3 border-b border-god-gold/20 pb-1">
                                            <Users size={18} />
                                            <span>주요 인물 (Select to view Profile)</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {factionFigures.map((person) => (
                                                <button 
                                                    key={person.id}
                                                    onClick={() => handleSelectFigure(person)}
                                                    className={`bg-white/5 p-3 rounded flex items-center gap-3 border border-white/5 hover:border-god-gold/50 hover:bg-white/10 transition-all text-left group ${person.status === 'Dead' ? 'opacity-60' : ''}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-god-gold border border-god-gold/20 flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden relative">
                                                        {person.portraitUrl ? (
                                                            <img src={person.portraitUrl} alt={person.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            person.status === 'Dead' ? <Cross size={18} className="text-slate-500" /> : <User size={18} />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-slate-200 font-display font-bold text-sm ${person.status === 'Dead' ? 'line-through decoration-slate-500' : ''}`}>
                                                            {person.name}
                                                        </span>
                                                        <span className="text-slate-500 text-xs italic font-serif">
                                                            {person.role} {person.status === 'Dead' ? '(Deceased)' : ''}
                                                        </span>
                                                    </div>
                                                    <Star size={12} className="ml-auto text-god-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                            {factionFigures.length === 0 && (
                                                <div className="col-span-2 text-center text-slate-500 italic text-sm py-4">
                                                    No known figures currently recorded.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                              ) : (
                                <div className="space-y-4 animate-fade-in pb-10">
                                   <div className="flex items-center justify-between text-slate-500 text-sm mb-4">
                                      <div className="flex items-center gap-2">
                                        <History size={16} />
                                        <span>Recorded Events involving {selectedFaction.name}</span>
                                      </div>
                                      <span className="text-xs bg-slate-800 px-2 py-1 rounded-full">{factionHistory.length} records</span>
                                   </div>
                                   
                                   {factionHistory.length > 0 ? (
                                      factionHistory.map((log) => (
                                        <div key={log.id} className="flex gap-4 group">
                                           <div className="flex flex-col items-center">
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-2 group-hover:bg-god-gold transition-colors"></div>
                                              <div className="w-px h-full bg-slate-800 my-1 group-hover:bg-slate-700 transition-colors"></div>
                                           </div>
                                           <div className="pb-4">
                                              <div className="text-xs font-mono text-slate-500 mb-1">Year {log.year}</div>
                                              <p className="text-sm text-slate-300 font-serif leading-relaxed">
                                                <RichText content={log.content} keywords={availableKeywords} onLinkClick={onLinkClick} />
                                              </p>
                                           </div>
                                        </div>
                                      ))
                                   ) : (
                                     <div className="text-center py-10 text-slate-600 italic">
                                        <AlertCircle className="mx-auto mb-2 opacity-50" />
                                        기록된 역사가 없습니다.
                                     </div>
                                   )}
                                </div>
                              )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-500 font-serif italic">
                            Select a faction to view its archives.
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LoreModal;
