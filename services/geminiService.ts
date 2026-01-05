
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
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for maximum speed
        tools: type === ToolType.KNOWLEDGE ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "Error: Signal lost.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.title && s.uri);

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
