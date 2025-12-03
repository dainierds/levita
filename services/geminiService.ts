import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateSermonOutline = async (passage: string, tone: string, language: string = 'Spanish'): Promise<string> => {
  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate outline.";
  } catch (error) {
    console.error("Error generating sermon:", error);
    return "Error generating sermon outline. Please check your API key and try again.";
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const prompt = `
      Translate the following religious/church context text into ${targetLanguage}. 
      Maintain the spiritual tone and accuracy.
      
      Text to translate: "${text}"
      
      Only return the translated text, nothing else.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error in translation.";
  }
};