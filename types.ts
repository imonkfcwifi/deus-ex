
export enum LogType {
  SCRIPTURE = 'SCRIPTURE', // "And the Lord said..."
  HISTORICAL = 'HISTORICAL', // "The Western Kingdom fell."
  CHAT = 'CHAT', // Player's raw input
  SYSTEM = 'SYSTEM', // "Year 100"
  CULTURAL = 'CULTURAL' // "The Renaissance began."
}

export interface LogEntry {
  id: string;
  year: number;
  type: LogType;
  content: string;
  flavor?: string; // E.g., "Book of Genesis 1:1"
  imageUrl?: string; // Visual representation of the event
  relatedFigureIds?: string[]; // IDs of people involved in this event
}

export interface Faction {
  name: string;
  power: number; // 0-100
  attitude: number; // -100 (Hate) to 100 (Worship)
  tenets: string[]; // e.g. ["Silent God", "Scientific Rationalism"]
  color: string;
  region?: string; // "North", "South", "East", "West", "Center", "Coast"
}

export interface Relationship {
  targetId: string; // ID of the other person
  targetName: string; // Name for fallback display
  value: number; // -100 (Nemesis) to 100 (Soulmate)
  type: string; // "Rival", "Mentor", "Lover", "Suspicious"
  description: string; // "Blames them for the harvest failure"
}

export interface Secret {
  id: string;
  title: string; // "Secret Correspondence"
  description: string; // "Secretly exchanging letters with the enemy faction leader."
  severity: 'Gossip' | 'Scandal' | 'Fatal'; 
  knownBy: string[]; // List of IDs who know this secret (could include player)
}

export interface Person {
  id: string;
  name: string;
  factionName: string; // Link to faction
  role: string; // e.g. "High Priest", "General"
  description: string; // Short summary
  biography: string; // Detailed life story
  birthYear: number;
  deathYear?: number; // If null, alive
  status: 'Alive' | 'Dead' | 'Missing' | 'Ascended';
  traits: string[]; // e.g. ["Ambitious", "Heretic"]
  portraitUrl?: string; // Base64 image data
  relationships: Relationship[]; // Social web
  secrets: Secret[]; // Hidden info
}

export interface WorldStats {
  year: number;
  population: number;
  technologicalLevel: string; // "Stone Age", "Iron Age", etc.
  culturalVibe: string; // "Despair", "Hopeful", "Theocratic", "Scientific"
  dominantReligion: string;
}

export interface DecisionOption {
  id: string;
  text: string;
  consequenceHint: string;
}

export interface PendingDecision {
  id: string;
  senderName: string; // "Prophet Elijah", "Chief Scientist"
  senderRole: string;
  message: string; // The DM content
  options: DecisionOption[];
}

export interface SimulationResult {
  newYear: number;
  populationChange: number;
  logs: LogEntry[];
  factions: Faction[];
  updatedFigures: Person[]; // Changed/New figures
  stats: Partial<WorldStats>;
  pendingDecision: PendingDecision | null; // If the AI decides a prophet speaks
}

export enum GameSpeed {
  PAUSED = 0,
  NORMAL = 1,
  FAST = 2
}
