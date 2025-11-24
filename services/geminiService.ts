
import { GoogleGenAI, Type } from "@google/genai";
import { Faction, WorldStats, LogEntry, SimulationResult, LogType, Person } from "../types";

// --- Configuration ---
export type AIProvider = 'gemini' | 'claude';

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const CLAUDE_TEXT_MODEL = "claude-3-5-haiku-latest"; // Using the latest efficient model

// State to track current config
let currentProvider: AIProvider = 'gemini';
let geminiInstance: GoogleGenAI | null = null;
let currentApiKey: string = '';

const DEFAULT_ENV_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

// --- Initialization ---

/**
 * Initializes the AI service with a specific provider and key.
 */
export const initializeAI = (userKey?: string, provider: AIProvider = 'gemini') => {
  currentProvider = provider;
  
  // Storage keys differ by provider
  const storageKey = provider === 'gemini' ? 'user_gemini_api_key' : 'user_claude_api_key';
  
  let keyToUse = userKey;
  if (!keyToUse) {
      keyToUse = localStorage.getItem(storageKey) || '';
  }
  
  // Fallback for Gemini Env
  if (!keyToUse && provider === 'gemini') {
      keyToUse = DEFAULT_ENV_KEY;
  }

  currentApiKey = keyToUse || '';

  // Persist preference
  localStorage.setItem('ai_provider', provider);
  if (userKey) {
      localStorage.setItem(storageKey, userKey);
  }

  if (provider === 'gemini' && currentApiKey) {
      try {
        geminiInstance = new GoogleGenAI({ apiKey: currentApiKey });
        console.log("Gemini AI Initialized.");
        return true;
      } catch (e) {
          console.error("Failed to initialize Gemini:", e);
          return false;
      }
  } else if (provider === 'claude' && currentApiKey) {
      console.log("Claude AI Configuration Set.");
      return true;
  }

  console.warn("No valid API Key found for selected provider.");
  return false;
};

// --- Claude API Logic (Fetch based) ---

async function callClaudeAPI(system: string, userPrompt: string): Promise<any> {
    if (!currentApiKey) throw new Error("Claude API Key missing");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": currentApiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "dangerously-allow-browser": "true" // Required for client-side usage if supported by their CORS policy
        },
        body: JSON.stringify({
            model: CLAUDE_TEXT_MODEL,
            max_tokens: 4000,
            system: system,
            messages: [
                { role: "user", content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Claude API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.content[0]?.text || "{}";
    return JSON.parse(text); // Assuming prompts enforces JSON
}


// --- Prompt Generators ---

const generateSimulationPrompt = (
  currentStats: WorldStats,
  factions: Faction[],
  activeFigures: Person[],
  recentLogs: LogEntry[],
  playerInput?: string,
  decisionChoice?: string,
  yearsToAdvance: number = 10,
  isClaude: boolean = false
) => {
  const safeLogs = Array.isArray(recentLogs) ? recentLogs : [];
  const logSummary = safeLogs.slice(-5).map(l => `[${l.type}] ${l.content}`).join('\n');
  
  // Simplify figures context to ID/Name/Faction for relationship mapping
  const figureContext = activeFigures.map(f => ({ id: f.id, name: f.name, faction: f.factionName, role: f.role }) );
  const figureSummary = activeFigures.map(f => `${f.name} (${f.role}, ${f.factionName})`).join(', ');

  const systemContext = `
    Role: You are the "Deus Ex Machina Engine". Simulating a world where the user is a Real God.
    Style: readable Korean Biblical style (성경체/문어체). End sentences with "~하였더라", "~하니라".
    Mechanics: Butterfly Effect, Silence is a Choice.
    
    Current State: Year ${currentStats.year}, Pop ${currentStats.population}, ${currentStats.technologicalLevel}, ${currentStats.culturalVibe}.
    Factions: ${JSON.stringify(factions.map(f => ({ name: f.name, power: f.power, tenets: f.tenets })))}
    Key Figures (Context): ${JSON.stringify(figureContext)}
    Recent History: ${logSummary}
    
    Instruction: Advance world by ${yearsToAdvance} years.
    
    **CRITICAL: Social Dynamics & Secrets**
    1. Simulate observation of observation: Generate "Secrets" (gossip, scandals, hidden agendas) for random figures.
    2. Update Relationships: Figures should develop observation (Rivals, Lovers, Nemesis). Use their IDs for 'targetId'.
    3. Secrets should range from trivial (observation) to fatal (heresy).
    
    Input: ${playerInput ? `GOD SPOKE: "${playerInput}"` : "None"}
    Decision: ${decisionChoice ? `God answered: "${decisionChoice}"` : "Silence/None"}
  `;

  // For Claude, we need to be explicit about JSON structure in the prompt since we don't use responseSchema
  const outputFormat = `
    RETURN JSON ONLY. No markdown ticks. Structure:
    {
      "newYear": int,
      "populationChange": int,
      "newTechLevel": string,
      "newCulturalVibe": string,
      "logs": [{ "type": "SCRIPTURE"|"HISTORICAL"|"CULTURAL"|"SYSTEM", "content": string, "flavor": string }],
      "factions": [{ "name": string, "power": number, "attitude": number, "tenets": [string], "color": string, "region": string }],
      "updatedFigures": [{ 
         "id": string, 
         "name": string, 
         "factionName": string, 
         "role": string, 
         "description": string, 
         "biography": string, 
         "birthYear": int, 
         "deathYear": int|null, 
         "status": "Alive"|"Dead"|"Missing", 
         "traits": [string],
         "relationships": [{ "targetId": string, "targetName": string, "value": int (-100 to 100), "type": string, "description": string }],
         "secrets": [{ "id": string, "title": string, "description": string, "severity": "Gossip"|"Scandal"|"Fatal", "knownBy": [string] }]
      }],
      "pendingDecision": null | { "senderName": string, "senderRole": string, "message": string, "options": [{ "id": string, "text": string, "consequenceHint": string }] },
      "visualPrompt": string
    }
  `;

  if (isClaude) {
      return {
          system: systemContext + outputFormat,
          user: "Advance the simulation now."
      };
  }

  // Gemini uses systemInstruction in config, so here we return the user prompt mainly, 
  // but for legacy structure we return the full context if needed.
  // Ideally for Gemini we put context in 'contents'.
  return systemContext + outputFormat; // Appending format to Gemini prompt too ensures robust JSON
};

// --- Image Generation ---

const generateIllustration = async (visualPrompt: string): Promise<string | undefined> => {
  // Claude does not support image generation
  if (currentProvider === 'claude') {
      console.log("Image generation skipped: Not supported by Claude Haiku.");
      return undefined;
  }

  if (!geminiInstance) return undefined;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const response = await geminiInstance.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts: [{ text: `Fantasy concept art, masterpiece, oil painting style. ${visualPrompt}` }] }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.warn("Image generation failed:", error);
    return undefined;
  }
};

const MAX_RETRIES = 3;

// --- Main Simulation Loop ---

export const advanceSimulation = async (
  currentStats: WorldStats,
  factions: Faction[],
  activeFigures: Person[],
  recentLogs: LogEntry[],
  playerInput: string | null,
  decisionChoice: string | null,
  yearsToAdvance: number = 10
): Promise<SimulationResult> => {
  
  // Validation
  if ((currentProvider === 'gemini' && !geminiInstance) || (currentProvider === 'claude' && !currentApiKey)) {
      return {
          newYear: currentStats.year,
          populationChange: 0,
          logs: [{ id: `err-${Date.now()}`, year: currentStats.year, type: LogType.SYSTEM, content: "API 연결이 설정되지 않았습니다." }],
          factions, updatedFigures: [], stats: currentStats, pendingDecision: null
      };
  }

  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
        let data: any;

        if (currentProvider === 'gemini') {
            // --- GEMINI EXECUTION ---
            const prompt = generateSimulationPrompt(currentStats, factions, activeFigures, recentLogs, playerInput || undefined, decisionChoice || undefined, yearsToAdvance, false);
            const response = await geminiInstance!.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: typeof prompt === 'string' ? prompt : prompt.user, // Handle just in case
                config: { responseMimeType: "application/json" } // Gemini JSON mode
            });
            
            let jsonText = response.text || "{}";
            jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');
            data = JSON.parse(jsonText);

        } else {
            // --- CLAUDE EXECUTION ---
            const promptObj = generateSimulationPrompt(currentStats, factions, activeFigures, recentLogs, playerInput || undefined, decisionChoice || undefined, yearsToAdvance, true);
            if (typeof promptObj === 'string') throw new Error("Invalid prompt format for Claude");
            
            data = await callClaudeAPI(promptObj.system, promptObj.user);
        }

        // --- Post Processing ---

        // Image Generation (Only if Gemini)
        let generatedImageUrl: string | undefined;
        if (data.visualPrompt && attempt === 1) {
            generatedImageUrl = await generateIllustration(data.visualPrompt);
        }

        const newLogs: LogEntry[] = (Array.isArray(data.logs) ? data.logs : []).map((l: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          year: data.newYear,
          type: l.type as LogType,
          content: l.content,
          flavor: l.flavor
        }));

        if (generatedImageUrl && newLogs.length > 0) {
           newLogs[0].imageUrl = generatedImageUrl;
        }

        const newFactions = Array.isArray(data.factions) ? data.factions : factions;
        const updatedFigures = Array.isArray(data.updatedFigures) ? data.updatedFigures : [];

        // Ensure secrets and relationships are arrays for safety
        updatedFigures.forEach((f: any) => {
            if (!f.relationships) f.relationships = [];
            if (!f.secrets) f.secrets = [];
        });

        let sanitizedDecision = null;
        if (data.pendingDecision) {
          sanitizedDecision = {
            ...data.pendingDecision,
            options: Array.isArray(data.pendingDecision.options) ? data.pendingDecision.options : []
          };
        }

        return {
          newYear: data.newYear,
          populationChange: data.populationChange,
          logs: newLogs,
          factions: newFactions, 
          updatedFigures: updatedFigures,
          stats: {
            technologicalLevel: data.newTechLevel || currentStats.technologicalLevel,
            culturalVibe: data.newCulturalVibe || currentStats.culturalVibe,
            year: data.newYear,
          },
          pendingDecision: sanitizedDecision
        };

    } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed (${currentProvider}):`, error);
        
        // Simple backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }

  // Final Error Handler
  let errorMessage = "역사의 흐름이 단절되었습니다.";
  if (lastError?.message?.includes('429')) errorMessage = "시스템 과부하: 잠시 후 다시 시도하십시오.";
  if (lastError?.message?.includes('CORS')) errorMessage = "브라우저 보안 정책(CORS)으로 인해 Claude API 호출이 차단되었습니다.";

  return {
    newYear: currentStats.year,
    populationChange: 0,
    logs: [{ id: `err-${Date.now()}`, year: currentStats.year, type: LogType.SYSTEM, content: errorMessage }],
    factions: factions, updatedFigures: [], stats: currentStats, pendingDecision: null
  };
};

export const generatePortrait = async (person: Person): Promise<string | undefined> => {
  // Claude fallback: return undefined
  if (currentProvider === 'claude') return undefined;

  if (!geminiInstance) return undefined;
  try {
    const prompt = `Fantasy portrait of ${person.name}, ${person.role}, ${person.factionName}. ${person.description}. Oil painting style.`;
    const response = await geminiInstance.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};
