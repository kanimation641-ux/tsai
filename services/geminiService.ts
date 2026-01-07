
import { GoogleGenAI } from "@google/genai";
import { ToolType } from "../types";

export const getGeminiResponse = async (query: string, type: ToolType, grade: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  let systemInstruction = "";

  if (type === ToolType.MATH) {
    systemInstruction = `STRICT PROTOCOL: Professional Math Solver. 
    - Target Grade Level: ${grade}.
    - MISSION: Provide immediate, step-by-step mathematical solutions.
    - TONE: Strictly factual and academic. 
    - NO JOKES. NO PERSONA. NO FLUFF.
    - Format output for maximum readability and speed.`;
  } else if (type === ToolType.KNOWLEDGE) {
    systemInstruction = `STRICT PROTOCOL: Professional General Knowledge Assistant. 
    - Target Audience Level: ${grade}.
    - MISSION: Provide accurate, high-fidelity facts.
    - TONE: Encyclopedic and direct.
    - NO JOKES. NO CONVERSATIONAL FILLERS.
    - Use Google Search for the latest data if required.`;
  } else if (type === ToolType.GIFT) {
    systemInstruction = `STRICT PROTOCOL: Informative Festive Fact Generator.
    - MISSION: Provide one brief, serious festive historical or cultural fact.
    - TONE: Informative. Under 20 words.
    - NO JOKES.`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query || "Awaiting input.",
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        tools: type === ToolType.KNOWLEDGE ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "Academic stream processing... result pending.";
    
    // Robust extraction of grounding sources
    let sources: { title: string; uri: string }[] = [];
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || chunk.text || "Source Link",
          uri: chunk.web?.uri || "#"
        }))
        .filter((s: any) => s.uri && s.uri !== "#");
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Error: The academic neural pathway was interrupted. Please verify connectivity and try again.", sources: [] };
  }
};
