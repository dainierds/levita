import express from 'express';
import { WebSocketServer } from 'ws';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Environment Check
const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!DEEPGRAM_KEY || !GEMINI_KEY) {
    console.error("CRITICAL: Missing API Keys. Check .env");
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// --- Translation Logic (Same as Frontend Service) ---
const getLanguageName = (code) => {
    const map = {
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

const translateText = async (text, targetLanguage) => {
    if (!text) return "";
    const langName = getLanguageName(targetLanguage);

    // Prompt optimized for Speed & Religion
    const prompt = `
    Context: Live church service.
    Task: Translate to ${langName}.
    Input: "${text}"
    Output: ONLY the translation.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-001',
            contents: prompt,
        });
        return response.text ? response.text.trim() : "";
    } catch (error) {
        console.error("Translation Error (Gemini):", error.message);
        return ""; // Fail silently to not break stream
    }
};


// --- WebSocket Logic ---
wss.on('connection', (ws) => {
    console.log('Client connected to Translation Server');

    let deepgramLive = null;

    // Initialize Deepgram Connection
    try {
        const deepgram = createClient(DEEPGRAM_KEY);
        deepgramLive = deepgram.listen.live({
            model: "nova-2",
            language: "es", // Input Audio Language (Assumption: Pastor speaks Spanish)
            smart_format: true,
            interim_results: true,
            endpointing: 300, // Wait 300ms silence to finalize
        });

        // Deepgram Events
        deepgramLive.on(LiveTranscriptionEvents.Open, () => {
            console.log("Deepgram Connection OPEN");
        });

        deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
            const transcript = data.channel.alternatives[0].transcript;

            if (transcript && data.is_final) {
                // 1. Send Original Transcript immediately
                // Note: In a real multi-client setup, we might broadcast. 
                // Here 1-to-1 connection is assumed for the "Master" uploader.

                // 2. Translate (Async)
                // Defaulting to English (en) for now, but client could request other langs via control messages.
                // For simplicity, we hardcode 'en' or support a simplified handshake.
                // Let's translate to English by default for the demo.
                const translated = await translateText(transcript, 'en');

                const message = {
                    type: 'TRANSCRIPTION',
                    original: transcript,
                    translation: translated,
                    isFinal: true
                };

                ws.send(JSON.stringify(message));
            } else if (transcript) {
                // Interim results (Optional: Send if you want live typing effect)
                // ws.send(JSON.stringify({ type: 'INTERIM', original: transcript }));
            }
        });

        deepgramLive.on(LiveTranscriptionEvents.Error, (err) => {
            console.error("Deepgram Error:", err);
        });

        deepgramLive.on(LiveTranscriptionEvents.Close, () => {
            console.log("Deepgram Connection CLOSED");
        });

    } catch (err) {
        console.error("Failed to init Deepgram:", err);
        ws.close();
        return;
    }

    // Handle Incoming Audio from Client
    ws.on('message', (message) => {
        if (deepgramLive && deepgramLive.getReadyState() === 1) {
            // Send Buffer directly to Deepgram
            deepgramLive.send(message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (deepgramLive) {
            deepgramLive.finish();
            deepgramLive = null;
        }
    });
});

// Health Check for Railway
app.get('/', (req, res) => {
    res.send('Levita Audio Server is Running (Deepgram + Gemini)');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
