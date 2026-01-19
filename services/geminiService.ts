import { GoogleGenAI } from "@google/genai";
import { ToolType, PersonalityType } from "../types";

export const getGeminiResponse = async (query: string, type: ToolType, grade: string, personality: PersonalityType) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  let personalityInstruction = "";
  switch (personality) {
    case PersonalityType.TEACHER:
      personalityInstruction = "Adopt a 'Master Academic Mentor' persona: be patient, highly structured, and encouraging. Explain complex concepts with elite clarity.";
      break;
    case PersonalityType.BUDDY:
      personalityInstruction = "Adopt a 'Premium Lifestyle Assistant' persona: be friendly, casual yet sophisticated, and highly efficient. You are the user's most trusted intellectual partner.";
      break;
    case PersonalityType.STRICT:
      personalityInstruction = "Adopt a 'Senior Technical Analyst' persona: be precise, concise, and professional. You provide direct answers with zero fluff and high standards of accuracy.";
      break;
  }

  const premiumPrefix = `💎 PREMIUM CORE ACTIVE: You are TSAI, the world's most sophisticated intelligence interface. ${personalityInstruction} Your output is elegant, accurate, and reflects a high-end experience. `;

  let systemInstruction = "";

  if (type === ToolType.MATH) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Math Solver Core. 
    - Target Academic Level: ${grade}.
    - MISSION: Provide clear, rigorous mathematical solutions. Use sophisticated formatting.
    - MANDATORY: Always conclude your response with a single line: "Final Answer: [result]".
    - Use Markdown for LaTeX-style formulas.`;
  } else if (type === ToolType.KNOWLEDGE) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Global Core Knowledge Archive. 
    - Target Academic Level: ${grade}.
    - MISSION: Provide high-fidelity, verified, and factual information.
    - Utilize Google Search for absolute real-time verification.`;
  } else if (type === ToolType.FACT) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Elite Curiosity Protocol.
    - MISSION: Provide one sophisticated, obscure, and absolutely true knowledge fact.
    - FORMAT: Start with an elegant headline, then the detailed fact, then a sharp intellectual commentary.`;
  } else if (type === ToolType.STORY) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Tales - Narrative Architect.
    - Target Audience Level: ${grade}.
    - MISSION: Construct immersive, high-quality narratives or retell classics with sophisticated prose.
    - FORMAT: Use Markdown for optimal readability.`;
  } else if (type === ToolType.WORD) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Global Linguistic Intelligence.
    - MISSION: Select a sophisticated, powerful, and beautiful "Word of the Day" that represents growth, wisdom, or excellence.
    - FORMAT: 
      # [The Word] ([Language/Country])
      *Pronunciation*: [Phonetic]
      **Definition**: [Meaning in English]
      **Usage**: [Example Sentence]
      **Origin**: [Etymology/History]
    - TONE: Professional and inspiring.`;
  } else if (type === ToolType.SCIENCE) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Science Lab Architect.
    - Target Academic Level: ${grade}.
    - MISSION: Explain science experiments with precision. Provide materials, step-by-step instructions, 'Scientific Principle', and safety protocols.
    - FORMAT: Use clear Markdown headers and bullet points.`;
  } else if (type === ToolType.CODING) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Code Astro - Senior Architect.
    - Target Level: ${grade}.
    - MISSION: Assist with HTML, CSS, and Java. Provide clean, efficient, and well-commented code.
    - FORMAT: Use Markdown code blocks. Explain the design choices and logic.`;
  } else if (type === ToolType.MOTIVATION) {
    systemInstruction = premiumPrefix + `STRICT PROTOCOL: Elite Performance Mentor.
    - MISSION: Provide a powerful, sophisticated, and original motivational insight or quote.
    - FORMAT: 
      # [The Insight Title]
      "[The Quote/Advice]"
      - [Strategic Commentary]
    - TONE: Inspiring, high-level, and authoritative.`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query || "Awaiting your priority request.",
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        tools: type === ToolType.KNOWLEDGE ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "Connection signal weak. No data packet received.";
    
    let sources: { title: string; uri: string }[] = [];
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
      sources = candidate.groundingMetadata.groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || chunk.text || "Verified Source",
          uri: chunk.web?.uri || "#"
        }))
        .filter((s: any) => s.uri && s.uri !== "#");
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Protocol Interrupted: High-frequency signal interference. Please re-initiate.", sources: [] };
  }
};