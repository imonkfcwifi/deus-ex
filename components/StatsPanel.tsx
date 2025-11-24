import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Faction, WorldStats } from '../types';
import { Users, Brain, Globe, TrendingUp } from 'lucide-react';

interface StatsPanelProps {
  stats: WorldStats;
  factions: Faction[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, factions }) => {
  
  // Defensive coding: Ensure factions is an array before mapping
  const safeFactions = Array.isArray(factions) ? factions : [];
  const data = safeFactions.map(f => ({ name: f.name, value: f.power, color: f.color }));

  const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center shadow-lg hover:border-slate-500/50 transition-colors group">
      <div className={`p-2 rounded-full bg-slate-800/50 mb-2 group-hover:scale-110 transition-transform duration-300 ${colorClass}`}>
          <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <span className="font-display font-bold text-sm text-slate-200">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      {/* Stat Grid */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <StatCard 
            icon={Users} 
            label="Population" 
            value={stats.population.toLocaleString()} 
            colorClass="text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
        />
        <StatCard 
            icon={Brain} 
            label="Era" 
            value={stats.technologicalLevel} 
            colorClass="text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        />
         <StatCard 
            icon={Globe} 
            label="Vibe" 
            value={stats.culturalVibe} 
            colorClass="text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
        />
      </div>

      {/* Faction Chart Card */}
      <div className="flex-1 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 flex flex-col relative overflow-hidden shadow-xl min-h-[300px]">
        <div className="flex items-center justify-between mb-4 z-10 relative flex-shrink-0">
            <h3 className="text-xs font-display font-bold text-slate-400 uppercase tracking-[0.2em]">Faction Power</h3>
            <TrendingUp className="w-4 h-4 text-slate-600" />
        </div>

        {/* Chart Container: Strictly defined height to prevent Recharts calculation errors */}
        <div className="flex-1 relative w-full h-full min-h-[250px] z-10">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="stroke-slate-900 stroke-2 outline-none hover:opacity-80 transition-opacity"
                      style={{ filter: `drop-shadow(0 0 4px ${entry.color}40)` }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        color: '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#f1f5f9', padding: 0 }}
                    formatter={(value: number) => [`${value}%`, 'Power']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className="text-3xl font-display font-bold text-slate-700 opacity-40">{safeFactions.length}</span>
             <span className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 opacity-60">Factions</span>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-god-gold/5 blur-3xl rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};

export default StatsPanel;