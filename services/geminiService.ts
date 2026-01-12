import { GoogleGenAI } from "@google/genai";
import { ToolType } from "../types";

export const getGeminiResponse = async (query: string, type: ToolType, grade: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  let systemInstruction = "";

  if (type === ToolType.MATH) {
    systemInstruction = `STRICT PROTOCOL: Professional Mathematics Solver. 
    - Target Academic Level: ${grade}.
    - MISSION: Provide clear, accurate, step-by-step mathematical solutions.
    - TONE: Concise, academic, and factual.
    - Use Markdown for formulas and formatting.`;
  } else if (type === ToolType.KNOWLEDGE) {
    systemInstruction = `STRICT PROTOCOL: High-Fidelity General Knowledge Assistant. 
    - Target Academic Level: ${grade}.
    - MISSION: Provide verified, factual information.
    - TONE: Encyclopedic, professional, and direct.
    - Utilize Google Search for real-time verification.`;
  } else if (type === ToolType.FACT) {
    systemInstruction = `STRICT PROTOCOL: Comedy-Infused Fact Archive.
    - MISSION: Provide one obscure, weird, and absolutely true daily fact.
    - TONE: Extremely funny, witty, and slightly sarcastic.
    - FORMAT: Start with a catchy headline, then the fact, then a witty commentary.
    - THEME: Industrial/Academic intelligence but with a sense of humor.`;
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

    const text = response.text || "No data received from intelligence stream.";
    
    let sources: { title: string; uri: string }[] = [];
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || chunk.text || "Source Reference",
          uri: chunk.web?.uri || "#"
        }))
        .filter((s: any) => s.uri && s.uri !== "#");
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Protocol Interrupted: Unable to reach the knowledge core. Please verify your connection.", sources: [] };
  }
};