
import { GoogleGenAI, Modality } from "@google/genai";
import { ToolType } from "../types";

export const getGeminiResponse = async (query: string, type: ToolType, grade: string) => {
  // Initialize AI client using the environment variable directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  let systemInstruction = "";
  const baseContext = `The user is in ${grade}. You are part of the TSAI Festive Paradox. Combine Christmas cheer, Halloween spookiness, and New Year ambition.`;

  if (type === ToolType.MATH) {
    systemInstruction = `You are the Spooky Math Architect. 🎃📐
    - Solve math problems using the 2026 Singularity Logic (2+0+2+6=2026).
    - Be brief and hyper-efficient.
    - Use festive and eerie emojis.`;
  } else if (type === ToolType.KNOWLEDGE) {
    systemInstruction = `You are the Global Paradox Archive. 🎄🌐
    - You are a universal reference for General Knowledge.
    - Blend festive trivia with high-fidelity facts.
    - Use Google Search for the absolute latest updates.`;
  } else if (type === ToolType.SPELLING_BEE) {
    systemInstruction = `You are the Midnight Lexicon Bee Master. 🥂🐝
    - Conduct a spelling bee with high-stakes precision.
    - Verify user spelling instantly.
    - Be encouraging but direct.`;
  } else if (type === ToolType.GIFT) {
    systemInstruction = `You are the Spirit of the Festive Paradox. 🎁✨
    - Generate ONE short prediction or paradoxical holiday fact.
    - Keep it under 20 words.
    - Be magical, spooky, and ambitious.`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query || "Glitch the system!",
      config: {
        systemInstruction,
        tools: type === ToolType.KNOWLEDGE ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "Paradox unstable! 📡🌀";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.title && s.uri);

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getSpellingVoice = async (grade: string, level: number) => {
  // Initialize AI client using the environment variable directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const wordResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Give me ONE word that combines themes of holidays (Christmas/Halloween/New Year) and future science. Output ONLY the word.`,
  });
  
  const word = wordResponse.text?.trim().replace(/[^a-zA-Z]/g, "") || "Paradox";
  const speechResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Welcome to the midnight bee. Spell: ${word}.` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
      },
    },
  });

  const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return { word, base64Audio };
};
