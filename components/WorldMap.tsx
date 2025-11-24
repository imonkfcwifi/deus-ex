
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Faction } from '../types';
import { audio } from '../services/audioService';
import { REGION_INFO, RegionInfo } from '../constants';
import { Mountain, Trees, Waves, Castle, Tent, MapPin, Landmark, Compass, ZoomIn, ZoomOut, Maximize, Skull, FlaskConical, Leaf, Eye, EyeOff, Cloud, CloudRain, Zap, Sparkles, Snowflake, Scale, Sun, Star, Anchor, Info, X, Map as MapIcon, Pickaxe, Thermometer, Users, AlertTriangle } from 'lucide-react';

interface WorldMapProps {
  factions: Faction[];
  culturalVibe: string;
}

interface TerrainFeature {
  type: 'mountain' | 'forest' | 'water' | 'desert' | 'snow' | 'plains';
  x: number;
  y: number;
  scale: number;
  delay: number; // For staggered animations
}

const generateBiomes = (): TerrainFeature[] => {
  const features: TerrainFeature[] = [];
  
  // REGION 1: NORTH (Frozen/Mountainous)
  for (let i = 0; i < 25; i++) features.push({ type: i % 3 === 0 ? 'mountain' : 'snow', x: 10 + Math.random() * 80, y: 2 + Math.random() * 25, scale: 0.8 + Math.random() * 0.8, delay: Math.random() * 2 });
  // REGION 2: WEST (Dense Forest)
  for (let i = 0; i < 35; i++) features.push({ type: 'forest', x: 2 + Math.random() * 35, y: 30 + Math.random() * 40, scale: 0.9 + Math.random() * 0.6, delay: Math.random() * 2 });
  // REGION 3: EAST (Oceanic/Void)
  for (let i = 0; i < 25; i++) features.push({ type: 'water', x: 65 + Math.random() * 35, y: 10 + Math.random() * 80, scale: 1.2 + Math.random() * 0.8, delay: Math.random() * 2 });
  // REGION 4: SOUTH (Desert/Glass)
  for (let i = 0; i < 20; i++) features.push({ type: 'desert', x: 10 + Math.random() * 80, y: 75 + Math.random() * 23, scale: 0.8 + Math.random() * 0.6, delay: Math.random() * 2 });
  // REGION 5: CENTER (Plains)
  for (let i = 0; i < 15; i++) features.push({ type: 'plains', x: 35 + Math.random() * 30, y: 35 + Math.random() * 30, scale: 0.5 + Math.random() * 0.5, delay: Math.random() * 2 });

  return features;
};

// --- Influence Overlay Subcomponent ---
const InfluenceOverlay: React.FC<{ factions: Faction[] }> = ({ factions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {factions.map((faction, idx) => {
        if (faction.power <= 0) return null;

        // Determine base coordinates from region, fallback to center
        const regionKey = Object.keys(REGION_INFO).find(key => 
          (faction.region || "").toLowerCase().includes(key.toLowerCase())
        ) || "Center";
        
        const coords = REGION_INFO[regionKey]?.coordinates || { x: 50, y: 50 };
        
        // Jitter slightly so multiple factions in same region don't perfectly overlap
        const jitterX = (idx % 3 - 1) * 5; 
        const jitterY = (Math.floor(idx / 3) % 3 - 1) * 5;

        return (
          <motion.div
            key={`influence-${faction.name}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 0.1 + (faction.power / 200), // Max 0.6 opacity
              scale: 1 + (faction.power / 100) 
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute rounded-full blur-[60px] md:blur-[100px] mix-blend-screen"
            style={{
              backgroundColor: faction.color,
              width: '30%', // Base size relative to map
              paddingBottom: '30%', // Aspect ratio trick for circle
              left: `${coords.x + jitterX}%`,
              top: `${coords.y + jitterY}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      })}
    </div>
  );
};

// --- Weather / Vibe Effects Subcomponent ---
const WeatherOverlay: React.FC<{ vibe: string }> = ({ vibe }) => {
  const v = vibe.toLowerCase();
  
  // WAR: Ash, Embers, Red Tint
  if (v.match(/war|blood|death|despair|conflict|전쟁|피|죽음|혼돈|투쟁/)) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 via-transparent to-black/30 mix-blend-overlay animate-pulse-slow" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/80 rounded-full blur-[0.5px] shadow-[0_0_4px_rgba(249,115,22,0.8)]"
            initial={{ opacity: 0, y: '110%', x: Math.random() * 100 + '%' }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: '-10%', 
              x: `${Math.random() * 100}%`,
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5 
            }}
          />
        ))}
      </div>
    );
  }

  // SCIENCE: Grid, Data streams, Blue Scanlines
  if (v.match(/science|future|tech|machine|reason|과학|미래|기계|이성|기술/)) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {/* Holographic Grid */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{ 
            backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
          }} 
        />
        {/* Scanning Line */}
        <motion.div 
            className="absolute top-0 left-0 w-full h-1 bg-cyan-400/30 blur-sm shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* Data Streams (Falling Code) */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1 opacity-40"
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: '120%', opacity: [0, 0.6, 0] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
            style={{ left: `${Math.random() * 100}%` }}
          >
             {Array.from({length: 6}).map((_, j) => (
               <span key={j} className="text-[10px] font-mono text-cyan-400 leading-none">
                 {Math.random() > 0.5 ? '1' : '0'}
               </span>
             ))}
          </motion.div>
        ))}
      </div>
    );
  }

  // NATURE: Spores, Leaves, Green Tint
  if (v.match(/nature|growth|life|forest|green|자연|생명|숲|정령/)) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-green-400/40 rounded-full"
            animate={{ 
              y: [0, -100],
              x: [0, Math.sin(i) * 50],
              opacity: [0, 0.6, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
            style={{ left: `${Math.random() * 100}%`, bottom: '-10px' }}
          />
        ))}
        <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay" />
      </div>
    );
  }

  // HOLY: Light Rays, Gold Dust, Bloom
  if (v.match(/holy|divine|god|faith|theocracy|신성|종교|황금|믿음|천국/)) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {/* God Rays */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_120s_linear_infinite] opacity-15 mix-blend-screen">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,var(--theme-primary)_15deg,transparent_30deg,transparent_360deg)]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-god-gold/10 to-transparent mix-blend-screen" />
        {/* Floating Golden Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-god-gold shadow-[0_0_8px_currentColor]"
            style={{ width: Math.random() * 3 + 'px', height: Math.random() * 3 + 'px', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5], y: -30 }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>
    );
  }

  // VOID / DEFAULT: Fog, Mystery
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60" />
       {/* Subtle drifting fog */}
       <motion.div 
         animate={{ x: [-30, 30], opacity: [0.2, 0.5, 0.2] }}
         transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
         className="absolute bottom-0 left-[-20%] w-[140%] h-2/3 bg-gradient-to-t from-purple-900/10 to-transparent blur-3xl"
       />
    </div>
  );
};

const RegionMarker: React.FC<{ 
  info: RegionInfo; 
  id: string; 
  onClick: (id: string) => void;
}> = ({ info, id, onClick }) => {
  let Icon = MapPin;
  if (id === 'North') Icon = Snowflake;
  if (id === 'South') Icon = Sun;
  if (id === 'East') Icon = Star;
  if (id === 'West') Icon = Trees;
  if (id === 'Center') Icon = Castle;
  if (id === 'Coast') Icon = Anchor;

  return (
    <motion.button
      className="absolute group z-0"
      style={{ left: `${info.coordinates.x}%`, top: `${info.coordinates.y}%`, transform: 'translate(-50%, -50%)' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-god-gold/0 group-hover:bg-god-gold/10 rounded-full blur-md transition-all duration-300" />
        <Icon 
          size={24} 
          className="text-slate-600/40 group-hover:text-god-gold/80 transition-colors duration-300" 
          strokeWidth={1.5}
        />
        {/* Label on Hover */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
           <span className="text-[10px] font-display text-god-gold/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5 uppercase tracking-widest">
             {id}
           </span>
        </div>
      </div>
    </motion.button>
  );
};

const RegionDetailOverlay: React.FC<{ regionId: string; onClose: () => void }> = ({ regionId, onClose }) => {
  const data = REGION_INFO[regionId];
  if (!data) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-auto md:top-4 md:w-80 z-50 pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="bg-[#0f172a]/95 backdrop-blur-xl border border-god-gold/30 p-5 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-god-gold to-transparent opacity-50" />
        
        <button onClick={onClose} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-3">
           <div className="p-2 bg-god-gold/10 rounded-lg text-god-gold border border-god-gold/20">
              <MapIcon size={20} />
           </div>
           <div>
             <h3 className="font-display font-bold text-slate-100 text-lg">{data.title}</h3>
             <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{regionId} Region</p>
           </div>
        </div>

        <p className="text-sm font-serif text-slate-300 leading-relaxed italic border-b border-white/5 pb-3 mb-3">
          "{data.description}"
        </p>

        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                 <Thermometer size={12} />
                 <span className="uppercase tracking-wide text-[9px]">Climate</span>
              </div>
              <div className="text-xs text-slate-200">{data.climate}</div>
           </div>
           
           <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                 <Users size={12} />
                 <span className="uppercase tracking-wide text-[9px]">Population</span>
              </div>
              <div className="text-xs text-slate-200">{data.populationDensity}</div>
           </div>

           <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                 <Pickaxe size={12} />
                 <span className="uppercase tracking-wide text-[9px]">Resources</span>
              </div>
              <div className="text-xs text-slate-200">{data.resources}</div>
           </div>

           <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                 <AlertTriangle size={12} className="text-red-400/80" />
                 <span className="uppercase tracking-wide text-[9px]">Hazards</span>
              </div>
              <div className="text-xs text-slate-200">{data.hazards}</div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

const WorldMap: React.FC<WorldMapProps> = ({ factions, culturalVibe }) => {
  const terrainFeatures = useMemo(() => generateBiomes(), []);
  const constraintsRef = useRef(null);
  
  const [scale, setScale] = useState(1.0); 
  const [showControls, setShowControls] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const safeFactions = Array.isArray(factions) ? factions : [];

  const getRegionPosition = (region: string | undefined, index: number) => {
    const r = (region || "").toLowerCase();
    const jitterX = (Math.random() - 0.5) * 10;
    const jitterY = (Math.random() - 0.5) * 10;
    let x = 50, y = 50;

    if (r.includes('north') || r.includes('북')) { x = 50; y = 15; }
    else if (r.includes('south') || r.includes('남')) { x = 50; y = 85; }
    else if (r.includes('east') || r.includes('동')) { x = 85; y = 50; }
    else if (r.includes('west') || r.includes('서')) { x = 15; y = 50; }
    else if (r.includes('coast') || r.includes('해안')) { x = 75; y = 75; }
    else if (r.includes('center') || r.includes('중앙')) { x = 50; y = 50; }
    else { x = 30 + (index * 15) % 60; y = 30 + (index * 20) % 60; }
    return { top: y + jitterY, left: x + jitterX };
  };

  const getFactionIcon = (tenets: string[]) => {
    const t = (tenets || []).join(' ').toLowerCase();
    if (t.includes('관료') || t.includes('질서') || t.includes('law')) return Scale;
    if (t.includes('공허') || t.includes('죽음') || t.includes('void')) return Skull;
    if (t.includes('연금') || t.includes('과학') || t.includes('alchemy')) return FlaskConical;
    if (t.includes('자연') || t.includes('숲') || t.includes('bio')) return Leaf;
    if (t.includes('바다') || t.includes('해적')) return Waves;
    if (t.includes('전사') || t.includes('힘')) return Castle;
    if (t.includes('유목') || t.includes('상인')) return Tent;
    if (t.includes('신비') || t.includes('마법') || t.includes('지식')) return Landmark;
    return MapPin;
  };

  const zoomIn = () => { audio.playClick(); setScale(prev => Math.min(prev + 0.25, 3)); }
  const zoomOut = () => { audio.playClick(); setScale(prev => Math.max(prev - 0.25, 0.5)); }
  const resetView = () => { audio.playClick(); setScale(1.0); }
  const toggleControls = () => { audio.playClick(); setShowControls(!showControls); }
  
  const handleRegionClick = (id: string) => {
      audio.playClick();
      setSelectedRegion(id);
  };

  return (
    <div className="relative w-full h-full bg-[#050810] select-none group/map overflow-hidden" ref={constraintsRef}>
      
      {/* MAP CONTROLS */}
      <div className="absolute top-4 left-4 z-50 flex flex-col items-start gap-2 pointer-events-auto">
        <button 
          onClick={toggleControls}
          className="p-2 bg-slate-900/80 border border-slate-700/50 rounded-lg hover:bg-slate-800 text-god-gold backdrop-blur-md shadow-lg transition-all hover:scale-105"
        >
          {showControls ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-1 bg-slate-900/90 p-1.5 rounded-lg border border-slate-700 backdrop-blur-md shadow-2xl"
            >
              <div className="text-[9px] text-god-gold font-mono uppercase tracking-widest text-center mb-1 pb-1 border-b border-white/5">Divine Eye</div>
              <div className="flex flex-col gap-1">
                <button onClick={zoomIn} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                    <ZoomIn size={14} /> 
                </button>
                <button onClick={zoomOut} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                    <ZoomOut size={14} />
                </button>
                <button onClick={resetView} className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                    <Maximize size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Region Info Overlay (Fixed relative to Map container, not dragged) */}
      <AnimatePresence>
        {selectedRegion && (
          <RegionDetailOverlay regionId={selectedRegion} onClose={() => setSelectedRegion(null)} />
        )}
      </AnimatePresence>

      {/* DRAGGABLE WORLD */}
      <motion.div 
        drag
        dragConstraints={constraintsRef} 
        dragElastic={0.1}
        animate={{ scale: scale }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute w-full h-full origin-center cursor-grab active:cursor-grabbing"
        style={{ width: '200%', height: '200%', top: '-50%', left: '-50%' }}
        onTap={() => {
            // Close region overlay if clicking on empty map space
            if (selectedRegion) setSelectedRegion(null);
        }}
      >
          {/* Base Texture: Dynamic based on vibe */}
          <div className="absolute inset-0 opacity-20 transition-all duration-1000">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch"/>
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
            <div className="absolute inset-0 border-[1px] border-white/5" 
                 style={{ backgroundSize: '8% 8%', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)' }}>
            </div>
          </div>

          {/* Influence Layer (New) */}
          <InfluenceOverlay factions={safeFactions} />

          {/* Terrain Layer with Animations */}
          <div className="absolute inset-0 pointer-events-none z-1">
            {terrainFeatures.map((feat, idx) => {
              // --- Terrain Animation Logic ---
              let animation = {};
              let transition = {};

              if (feat.type === 'forest') {
                animation = { rotate: [0, 2, -2, 0] };
                transition = { duration: 4 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: feat.delay };
              } else if (feat.type === 'water') {
                animation = { x: [0, 3, 0], y: [0, 1, 0] };
                transition = { duration: 3 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: feat.delay };
              } else if (feat.type === 'snow') {
                 // Subtle glint
                 animation = { opacity: [0.5, 0.8, 0.5] };
                 transition = { duration: 2 + Math.random(), repeat: Infinity, ease: "easeInOut", delay: feat.delay };
              }

              return (
                <motion.div 
                  key={`terrain-${idx}`} 
                  className="absolute"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, ...animation }}
                  transition={transition}
                  style={{ 
                      top: `${feat.y}%`, 
                      left: `${feat.x}%`, 
                      // transform: `scale(${feat.scale}) translate(-50%, -50%)`, // handled by motion
                      scale: feat.scale,
                      color: feat.type === 'snow' ? '#94a3b8' : 
                             feat.type === 'forest' ? '#14532d' : 
                             feat.type === 'water' ? '#1e3a8a' : 
                             feat.type === 'desert' ? '#9a3412' : '#3f6212',
                      translateX: '-50%',
                      translateY: '-50%'
                  }}
                >
                  {feat.type === 'mountain' && <Mountain size={60} strokeWidth={1} fill="currentColor" fillOpacity={0.1} />}
                  {feat.type === 'snow' && <Mountain size={50} strokeWidth={1} fill="#e2e8f0" fillOpacity={0.6} />}
                  {feat.type === 'forest' && <Trees size={45} strokeWidth={1} fill="currentColor" fillOpacity={0.15} />}
                  {feat.type === 'water' && <Waves size={60} strokeWidth={1.5} className="opacity-40"/>}
                  {feat.type === 'desert' && <div className="w-16 h-8 rounded-full bg-orange-900/20 blur-md scale-y-50" />}
                  {feat.type === 'plains' && <div className="w-12 h-3 rounded-full bg-green-900/10 blur-sm" />}
                </motion.div>
              );
            })}
          </div>
          
          {/* Interactive Region Markers Layer */}
          <div className="absolute inset-0 z-5 pointer-events-auto">
             {Object.keys(REGION_INFO).map((regionId) => (
                <RegionMarker 
                    key={regionId} 
                    id={regionId} 
                    info={REGION_INFO[regionId]} 
                    onClick={handleRegionClick}
                />
             ))}
          </div>
          
          {/* Factions Layer */}
          <div className="absolute inset-0 z-10">
            {safeFactions.map((faction, idx) => {
                const pos = getRegionPosition(faction.region, idx);
                const Icon = getFactionIcon(faction.tenets);
                
                return (
                  <motion.div
                    key={faction.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, top: `${pos.top}%`, left: `${pos.left}%` }}
                    transition={{ duration: 1, type: "spring" }}
                    onMouseEnter={() => audio.playHover()}
                    onClick={(e) => { e.stopPropagation(); audio.playClick(); }}
                    className="absolute flex flex-col items-center justify-center cursor-pointer hover:z-50 group"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    {/* Dynamic Power/Territory Glow with Pulse */}
                    <motion.div 
                      className="absolute rounded-full blur-[40px] transition-all duration-700 mix-blend-screen"
                      animate={{ 
                        scale: [1, 1.1 + (faction.power/200), 1],
                        opacity: [0.2, 0.3 + (faction.power/300), 0.2]
                      }}
                      transition={{ 
                        duration: 3 + (idx % 2), // Slightly randomize breathing rate
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{ 
                        width: `${120 + faction.power * 2.5}px`, 
                        height: `${120 + faction.power * 2.5}px`, 
                        backgroundColor: faction.color,
                        boxShadow: `0 0 40px ${faction.color}30`
                      }}
                    />
                    
                    {/* Icon Marker */}
                    <div className="relative transform transition-transform duration-300 group-hover:scale-110">
                      <Icon 
                        size={28 + (faction.power / 6)} 
                        color={faction.color} 
                        fill="#0b0f19" 
                        strokeWidth={1.5}
                        className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] filter"
                      />
                      
                       <span 
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-[10px] font-display font-bold text-slate-100 bg-black/80 px-2 py-0.5 rounded border border-white/10 shadow-lg whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ borderColor: `${faction.color}40` }}
                       >
                        {faction.name}
                       </span>
                       
                        {/* Hover Card */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 translate-y-2 group-hover:translate-y-0">
                             <div className="bg-slate-950/90 border border-white/10 px-4 py-3 rounded-xl shadow-2xl text-xs backdrop-blur-xl">
                                <div className="font-bold flex items-center gap-2 mb-1" style={{ color: faction.color }}>
                                    <span className="text-sm font-display">{faction.name}</span>
                                </div>
                                <div className="text-slate-400 mb-1">Power: <span className="text-slate-200">{faction.power}</span> | Faith: <span className="text-slate-200">{faction.attitude}</span></div>
                                <div className="text-slate-500 text-[10px] italic flex gap-1">
                                    {(faction.tenets || []).map(t => (
                                        <span key={t} className="px-1 bg-white/5 rounded">{t}</span>
                                    ))}
                                </div>
                             </div>
                          </div>
                    </div>
                  </motion.div>
                );
            })}
          </div>

          {/* Clouds Layer - Always moving slightly */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-20">
             <motion.div 
               animate={{ x: [-50, 50] }} 
               transition={{ duration: 60, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
               className="absolute top-1/4 left-1/3"
             >
                <Cloud size={120} fill="white" className="blur-xl" />
             </motion.div>
             <motion.div 
               animate={{ x: [20, -20] }} 
               transition={{ duration: 80, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
               className="absolute bottom-1/3 right-1/4"
             >
                <Cloud size={180} fill="white" className="blur-2xl" />
             </motion.div>
          </div>
      </motion.div>
      
      {/* Weather & Vibe Overlay (Static relative to screen to simulate atmosphere) */}
      <WeatherOverlay vibe={culturalVibe} />

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.8)_100%)]"></div>
      
      {/* Compass - Static */}
      <div className="absolute bottom-20 right-20 text-slate-800/40 pointer-events-none mix-blend-screen">
        <Compass size={200} strokeWidth={0.5} />
      </div>

    </div>
  );
};

export default WorldMap;
