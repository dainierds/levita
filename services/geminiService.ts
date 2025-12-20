import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const getLanguageName = (code: string): string => {
  const map: Record<string, string> = {
    'es': 'Spanish',
    'en': 'English',
    'pt': 'Portuguese',
    'fr': 'French',
    'de': 'German',
    'ko': 'Korean',
    'zh': 'Chinese'
  };
  return map[code] || code;
};

export const generateSermonOutline = async (passage: string, tone: string, language: string = 'Spanish'): Promise<string> => {
  const prompt = `
      Act as a senior theologian and homiletics expert. 
      Create a structured sermon outline for the Bible passage: "${passage}".
      The tone of the sermon should be: "${tone}".
      The output language MUST be: "${language}".
      
      Structure the output as follows:
      1. Title
      2. Introduction (Hook)
      3. Main Point 1 (Exegesis)
      4. Main Point 2 (Application)
      5. Main Point 3 (Conclusion/Call to Action)
      
      Keep it concise and ready for a preacher's notes. Use Markdown formatting.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-001',
      contents: prompt,
    });
    return response.text || "Could not generate outline.";
  } catch (error) {
    console.warn("Primary model failed, retrying with fallback...", error);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-pro',
        contents: prompt,
      });
      return response.text || "Could not generate outline.";
    } catch (fallbackError) {
      console.error("Error generating sermon:", fallbackError);
      return "Error generating sermon outline. Please check your API key and try again.";
    }
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const langName = getLanguageName(targetLanguage);
  const prompt = `
      You are a professional translator for a church service.
      Translate the following text into ${langName}.
      Keep the output strictly to the translation. Do not add explanations or notes.
      If the text is unclear, try to infer the meaning in a religious context.
      
      Text: "${text}"
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-001',
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.warn("Primary model translation failed, retrying with fallback...", error);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-pro',
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (fallbackError) {
      console.error("Translation error:", fallbackError);
      return "Error in translation.";
    }
  }
};