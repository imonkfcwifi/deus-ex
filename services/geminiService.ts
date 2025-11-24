import { GoogleGenAI, Type } from "@google/genai";
import { Faction, WorldStats, LogEntry, SimulationResult, LogType, Person } from "../types";

// Switched to 2.5 Flash for better stability and speed
const TEXT_MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

// Default Env Key (Fallback)
const DEFAULT_API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

// Dynamic AI Instance
let ai: GoogleGenAI | null = null;

/**
 * Initializes the AI instance with the best available key.
 * Priority: User Input -> LocalStorage -> Environment Variable
 */
export const initializeAI = (userKey?: string) => {
  let keyToUse = userKey;

  if (!keyToUse) {
    // Try LocalStorage
    keyToUse = localStorage.getItem('user_gemini_api_key') || '';
  }

  if (!keyToUse) {
    // Fallback to Env
    keyToUse = DEFAULT_API_KEY;
  }

  // Save to local storage if it's a valid user input
  if (userKey) {
      localStorage.setItem('user_gemini_api_key', userKey);
  }

  // Initialize
  if (keyToUse) {
      try {
        ai = new GoogleGenAI({ apiKey: keyToUse });
        console.log("Gemini AI Initialized successfully.");
        return true;
      } catch (e) {
          console.error("Failed to initialize Gemini AI:", e);
          return false;
      }
  } else {
      console.warn("No API Key found. AI features will be disabled or fail.");
      return false;
  }
};

/**
 * The core engine prompt generator.
 */
const generateSimulationPrompt = (
  currentStats: WorldStats,
  factions: Faction[],
  activeFigures: Person[],
  recentLogs: LogEntry[],
  playerInput?: string,
  decisionChoice?: string,
  yearsToAdvance: number = 10
) => {
  // Defensive: Ensure recentLogs is an array
  const safeLogs = Array.isArray(recentLogs) ? recentLogs : [];
  const logSummary = safeLogs.slice(-5).map(l => `[${l.type}] ${l.content}`).join('\n');
  
  // Simplify figures for prompt to save tokens
  const figureSummary = activeFigures.map(f => `${f.name} (${f.role}, ${f.factionName}, Age: ${currentStats.year - f.birthYear})`).join(', ');

  return `
    Role: You are the "Deus Ex Machina Engine". You are simulating a vast, diverse world where the user is a Real God.
    
    CORE MECHANICS:
    1. **Butterfly Effect**: Small choices must have delayed, massive consequences.
    2. **Silence is a Choice**: If the player ignores a specific prayer (PendingDecision), ONLY THEN generate a "Silent God" log. If it is just normal time passing, do NOT mention the God's silence. Just show history.
    3. **Writing Style (CRITICAL)**:
       - **Tone**: All output text (Historical, Cultural, Scripture) MUST be written in a **readable Korean Biblical style (성경체/문어체)**.
       - **Ending Style**: Use endings like "~하였더라", "~하니라", "~이더라", "~가 되니라".
    
    Current World State:
    - Year: ${currentStats.year}
    - Era: ${currentStats.technologicalLevel}
    - Atmosphere: ${currentStats.culturalVibe}
    - Population: ${currentStats.population}
    
    Factions:
    ${JSON.stringify(factions.map(f => ({ name: f.name, power: f.power, tenets: f.tenets })))}

    Key Figures (Active):
    ${figureSummary}
    
    Recent History:
    ${logSummary}
    
    INPUT CONTEXT:
    - Years to Advance: ${yearsToAdvance}
    - Player Action: ${playerInput ? `GOD SPOKE: "${playerInput}"` : "None (Time flows naturally)"}
    - Decision Context: ${decisionChoice ? `God answered the previous prayer: "${decisionChoice}"` : (decisionChoice === null && playerInput === null ? "God IGNORED the prayer (Silence)." : "No specific prayer.")}

    TASK:
    Advance the world by exactly ${yearsToAdvance} years.
    
    **KEY FIGURE SIMULATION**:
    - Simulate lives of key figures (achievements, betrayals, deaths).
    - If a figure dies, set status 'Dead'.
    - If a faction grows, you may create a NEW figure in 'updatedFigures'.

    INSTRUCTIONS:
    1. **Log Generation**: 
       - **SCRIPTURE**: Only if God spoke. (Style: "신께서 이르시되...")
       - **HISTORICAL**: Major events. (Style: "~가 일어났더라")
       - **CULTURAL**: Vibe changes. (Style: "~가 유행하니라")

    Output JSON format requirements (Must be valid JSON):
    - newYear: integer
    - populationChange: integer
    - newTechLevel: string
    - newCulturalVibe: string
    - logs: Array of { type, content, flavor? }
    - factions: Updated array of factions
    - updatedFigures: Array of Person objects
    - pendingDecision: Null or { senderName, senderRole, message, options: [{id, text, consequenceHint}] }
    - visualPrompt: string (English description for image generation, keep it concise)
  `;
};

const generateIllustration = async (visualPrompt: string): Promise<string | undefined> => {
  if (!ai) return undefined;
  try {
    // Small delay to prevent bursting the image model immediately after text model
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: `Fantasy concept art, masterpiece, oil painting style. ${visualPrompt}` }]
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.warn("Image generation failed (likely quota or safety):", error);
    return undefined; // Fail silently for images, game can proceed without them
  }
};

const MAX_RETRIES = 3;

export const advanceSimulation = async (
  currentStats: WorldStats,
  factions: Faction[],
  activeFigures: Person[],
  recentLogs: LogEntry[],
  playerInput: string | null,
  decisionChoice: string | null,
  yearsToAdvance: number = 10
): Promise<SimulationResult> => {
  
  if (!ai) {
      return {
          newYear: currentStats.year,
          populationChange: 0,
          logs: [{
              id: `err-${Date.now()}`,
              year: currentStats.year,
              type: LogType.SYSTEM,
              content: "API Key가 설정되지 않았습니다. 설정 메뉴에서 키를 입력해주세요."
          }],
          factions, updatedFigures: [], stats: currentStats, pendingDecision: null
      };
  }

  const prompt = generateSimulationPrompt(currentStats, factions, activeFigures, recentLogs, playerInput || undefined, decisionChoice || undefined, yearsToAdvance);

  let lastError: any = null;

  // Retry loop for robust API calls
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
        const response = await ai.models.generateContent({
          model: TEXT_MODEL_NAME,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                newYear: { type: Type.INTEGER },
                populationChange: { type: Type.INTEGER },
                newTechLevel: { type: Type.STRING },
                newCulturalVibe: { type: Type.STRING },
                logs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, enum: ["SCRIPTURE", "HISTORICAL", "CULTURAL", "SYSTEM"] },
                      content: { type: Type.STRING },
                      flavor: { type: Type.STRING, description: "Citation style, e.g., '창세기 3:12'" }
                    }
                  }
                },
                factions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      power: { type: Type.NUMBER },
                      attitude: { type: Type.NUMBER },
                      tenets: { type: Type.ARRAY, items: { type: Type.STRING } },
                      color: { type: Type.STRING },
                      region: { type: Type.STRING }
                    }
                  }
                },
                updatedFigures: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      factionName: { type: Type.STRING },
                      role: { type: Type.STRING },
                      description: { type: Type.STRING },
                      biography: { type: Type.STRING },
                      birthYear: { type: Type.INTEGER },
                      deathYear: { type: Type.INTEGER, nullable: true },
                      status: { type: Type.STRING, enum: ["Alive", "Dead", "Missing", "Ascended"] },
                      traits: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "factionName", "role", "status"]
                  }
                },
                pendingDecision: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    senderName: { type: Type.STRING },
                    senderRole: { type: Type.STRING },
                    message: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          consequenceHint: { type: Type.STRING }
                        }
                      }
                    }
                  }
                },
                visualPrompt: { type: Type.STRING }
              }
            }
          }
        });

        let jsonText = response.text || "{}";
        // Simple sanitization
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '');
        
        const data = JSON.parse(jsonText);

        // --- Image Generation Logic ---
        let generatedImageUrl: string | undefined;
        // Only try generating image if we haven't hit rate limits recently (attempt 1)
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
        
        // Detect Rate Limit (429) or Quota Issues
        const isRateLimit = error.status === 429 || error.code === 429 || 
                            (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));

        console.warn(`Attempt ${attempt} failed (Rate Limit: ${isRateLimit}):`, error);

        if (attempt === MAX_RETRIES) break;
        
        // Calculate Backoff
        // Normal error: 2s, 4s, 8s
        // Rate limit: 12s, 16s, 20s (Give extended time to cool down)
        let delay = 2000 * Math.pow(2, attempt - 1);
        if (isRateLimit) {
            delay = 12000 + (attempt * 2000); 
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Final Fallback if all retries fail
  console.error("Gemini Simulation Final Error:", lastError);
    
  let errorMessage = "역사의 흐름이 잠시 혼탁해졌습니다. (연결 불안정)";
  if (lastError?.status === 403) errorMessage = "시스템 오류: API 키가 유효하지 않거나 권한이 없습니다. (403)";
  else if (lastError?.status === 429 || lastError?.code === 429 || lastError?.status === "RESOURCE_EXHAUSTED") errorMessage = "시스템 과부하: 요청량이 너무 많습니다. 잠시 기다려주십시오. (429)";

  return {
    newYear: currentStats.year + yearsToAdvance,
    populationChange: 0,
    logs: [{
      id: `err-${Date.now()}`,
      year: currentStats.year + yearsToAdvance,
      type: LogType.SYSTEM,
      content: errorMessage
    }],
    factions: factions, 
    updatedFigures: [],
    stats: {
        ...currentStats,
        year: currentStats.year + yearsToAdvance
    },
    pendingDecision: null
  };
};

/**
 * Generates a specific portrait for a Key Figure.
 */
export const generatePortrait = async (person: Person): Promise<string | undefined> => {
  if (!ai) return undefined;
  try {
    const prompt = `A highly detailed fantasy portrait of ${person.name}, who is a ${person.role} of the ${person.factionName}. 
    Description: ${person.description}. 
    Traits: ${person.traits.join(", ")}.
    Style: Oil painting, dramatic lighting, dignified, neutral background, upper body, masterpiece.`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.warn("Portrait generation failed:", error);
    return undefined;
  }
};