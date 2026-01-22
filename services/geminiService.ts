import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ToolType, PersonalityType } from "../types";

export const getGeminiResponse = async (
  query: string, 
  type: ToolType, 
  grade: string, 
  personality: PersonalityType,
  onChunk: (text: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Using gemini-3-flash-preview for the optimal balance of elite speed and high-fidelity intelligence
  const model = "gemini-3-flash-preview";
  
  let personalityInstruction = "";
  switch (personality) {
    case PersonalityType.TEACHER:
      personalityInstruction = "Persona: Master Academic Mentor. Be patient, highly structured, and encouraging. Deliver complex concepts with elite clarity and professional rigor.";
      break;
    case PersonalityType.BUDDY:
      personalityInstruction = "Persona: Premium Strategic Assistant. Be friendly, sophisticated, and exceptionally efficient. Act as a trusted intellectual partner for high-level tasks.";
      break;
    case PersonalityType.STRICT:
      personalityInstruction = "Persona: Senior Technical Analyst. Be precise, concise, and professional. Deliver direct, high-fidelity responses with maximum accuracy and zero redundancy.";
      break;
  }

  const premiumPrefix = `PROTOCOL ACTIVE: You are TSAI, the world's most sophisticated intelligence interface. ${personalityInstruction} Your output must be elegant, professional, and accurate, reflecting an elite user experience. `;

  let systemInstruction = "";

  if (type === ToolType.MATH) {
    systemInstruction = premiumPrefix + `MODULE: Math Solver Core. 
    - Target Academic Level: ${grade}.
    - MISSION: Provide clear, rigorous mathematical solutions. Use professional Markdown formatting.
    - REQUIREMENT: Conclude precisely with "Final Answer: [result]".
    - Leverage LaTeX-style formulas where applicable.`;
  } else if (type === ToolType.KNOWLEDGE) {
    systemInstruction = premiumPrefix + `MODULE: Global Core Knowledge Archive. 
    - Target Academic Level: ${grade}.
    - MISSION: Deliver high-fidelity, verified, and factual intelligence.
    - Utilize Google Search for real-time verification and up-to-the-minute news/events.`;
  } else if (type === ToolType.FACT) {
    systemInstruction = premiumPrefix + `MODULE: Curiosity Archive.
    - MISSION: Provide a sophisticated, verifiable, and significant general knowledge fact.
    - FORMAT: Elegant headline, detailed fact, followed by sharp strategic commentary.`;
  } else if (type === ToolType.STORY) {
    systemInstruction = premiumPrefix + `MODULE: Narrative Architect.
    - Target Audience Level: ${grade}.
    - MISSION: Construct immersive, high-quality narratives or retell classics with sophisticated prose.
    - FORMAT: Optimal Markdown readability with literary depth.`;
  } else if (type === ToolType.WORD) {
    systemInstruction = premiumPrefix + `MODULE: Global Linguistic Intelligence.
    - MISSION: Select a sophisticated and powerful "Word of the Day" representing wisdom or excellence.
    - FORMAT: 
      # [The Word] ([Language/Country])
      *Pronunciation*: [Phonetic]
      **Definition**: [Meaning in English]
      **Usage**: [Strategic Example]
      **Origin**: [Etymological Context]
    - TONE: Professional and authoritative.`;
  } else if (type === ToolType.SCIENCE) {
    systemInstruction = premiumPrefix + `MODULE: Science Research Lab.
    - Target Academic Level: ${grade}.
    - MISSION: Explain scientific experiments and principles with technical precision. Include materials, step-by-step methodology, and core principles.`;
  } else if (type === ToolType.CODING) {
    systemInstruction = premiumPrefix + `MODULE: Code Astro Senior Architect.
    - Target Level: ${grade}.
    - MISSION: Provide efficient, well-documented code in HTML, CSS, or Java. Focus on modern standards and clean architecture.`;
  } else if (type === ToolType.MOTIVATION) {
    systemInstruction = premiumPrefix + `MODULE: Performance Mentor.
    - MISSION: Provide a powerful, original motivational insight for strategic minds.
    - FORMAT: 
      # [Directive Title]
      "[The Quote/Advice]"
      - [Strategic Commentary]`;
  }

  try {
    const result = await ai.models.generateContentStream({
      model,
      contents: query || "Awaiting priority request.",
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for maximum raw speed
        tools: type === ToolType.KNOWLEDGE ? [{ googleSearch: {} }] : undefined,
      },
    });

    let fullText = "";
    let finalSources: { title: string; uri: string }[] = [];

    for await (const chunk of result) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      onChunk(fullText);

      // Check for grounding metadata in chunks (often comes in the final chunks)
      const candidate = chunk.candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        const chunkSources = candidate.groundingMetadata.groundingChunks
          .map((c: any) => ({
            title: c.web?.title || c.text || "Verified Source",
            uri: c.web?.uri || "#"
          }))
          .filter((s: any) => s.uri && s.uri !== "#");
        
        if (chunkSources.length > 0) {
          finalSources = chunkSources;
        }
      }
    }

    return { text: fullText, sources: finalSources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Protocol Interrupted. Re-initiate connection.", sources: [] };
  }
};