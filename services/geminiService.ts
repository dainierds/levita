import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';

// Configure PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Could not generate outline.";
  } catch (error) {
    console.warn("Primary model failed, retrying with fallback...", error);
    try {
      const result = await fallbackModel.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Could not generate outline.";
    } catch (fallbackError) {
      console.error("Error generating sermon:", fallbackError);
      return "Error generating sermon outline. Please check your API key and try again.";
    }
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const langName = getLanguageName(targetLanguage);
  const prompt = `
    Role: You are a real-time translator for Christian sermons.
    Context: Live church service.
    Tone: Solemn, respectful, and biblically accurate.
    Task: Translate the following text to ${langName}.
    Input: "${text}"
    Output: ONLY the translation, no explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() ? response.text().trim() : "";
  } catch (error) {
    console.warn("Primary model translation failed, retrying with fallback...", error);
    try {
      const result = await fallbackModel.generateContent(prompt);
      const response = await result.response;
      return response.text() ? response.text().trim() : "";
    } catch (fallbackError) {
      console.error("Translation error:", fallbackError);
      return "Error in translation.";
    }
  }
};
// Helper to convert File to base64
const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseEventsFromImage = async (imageFile: File): Promise<any[]> => {
  const prompt = `
    Analyze this image of a schedule/calendar. 
    Extract ALL events found in the image and return them as a strict JSON array.
    
    Current Year Context: ${new Date().getFullYear()} (Use this if year is missing, unless image specifies another year).
    
    Each event object must have:
    - title: string (The name of the event or activity)
    - date: string (Format YYYY-MM-DD. Infer month/year from headers if needed. If day is "Saturday 4" and header says "April", calculate it.)
    - time: string (Format HH:mm in 24h format. e.g. "17:00". If range "3:00 - 5:00", take start time.)
    - description: string (Any extra details, preacher name, or sub-activities)
    - type: string (Enum: "SERVICE", "SOCIAL", "PRAYER", "MINISTRY". Default to "SERVICE" if unsure or generic.)
    
    Rules:
    - If multiple events are listed applied to a single date (e.g. "Sábado 4: Event A", then below "3:00 Event B"), create separate event objects for each.
    - Ignore pure headers like "April 2026" that don't have specific activity attached, use them only for context.
    - Return ONLY the JSON array. No markdown formatting, no code blocks like \`\`\`json. Just the raw array string.
  `;

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Cleanup basic markdown if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error parsing events from image:", error);
    throw new Error("Could not parse events from image.");
  }
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `\n--- Page ${i} ---\n${pageText}`;
  }
  return fullText;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const parseEventsFromDocument = async (file: File): Promise<any[]> => {
  try {
    let promptContent: any[] = [];
    const basePrompt = `
    Analyze this schedule/calendar. 
    Extract ALL events found and return them as a strict JSON array.
    
    Current Year Context: ${new Date().getFullYear()} (Use this if year is missing).
    
    Each event object must have:
    - title: string 
    - date: string (YYYY-MM-DD)
    - time: string (HH:mm 24h)
    - description: string
    - type: string ("SERVICE", "SOCIAL", "PRAYER", "MINISTRY")
    
    Return ONLY JSON array.
    `;

    if (file.type === 'application/pdf') {
      const text = await extractTextFromPDF(file);
      promptContent = [`${basePrompt}\n\nDOCUMENT TEXT CONTENT:\n${text}`];
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
      const text = await extractTextFromDocx(file);
      promptContent = [`${basePrompt}\n\nDOCUMENT TEXT CONTENT:\n${text}`];
    } else if (file.type.startsWith('image/')) {
      const imagePart = await fileToGenerativePart(file);
      promptContent = [basePrompt, imagePart];
    } else {
      throw new Error("Unsupported file type: " + file.type);
    }

    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Error parsing document:", error);
    throw error;
  }
};