import express from 'express';
import { WebSocketServer } from 'ws';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
// Initialize Gemini
// const genAI = new GoogleGenerativeAI(GEMINI_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- debug: List Models on Startup ---


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

    // Switch to Gemini 2.0 Flash (Experimental) as it appears in the available models list
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{
                text: `System: You are a high-fidelity real-time translator. Your ONLY function is to translate text from Spanish to English.
Rules:
1. Output MUST be in English.
2. Do NOT transcribe or repeat the Spanish input.
3. Do NOT summarize or explain.
4. If the input is already English, output it as is (or correct grammar).
5. Maintain a solemn, biblical tone suitable for a church service.

Input to Translate:
<text>
Translate to English: "${text}"
</text>`
            }]
        }],
        generationConfig: {
            temperature: 0.1, // Low temperature for deterministic output
            maxOutputTokens: 200,
        }
    };

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                // console.error(`Gemini API Error (Attempt ${attempts + 1}):`, errText); // Optional: uncomment for debug
                attempts++;
                if (attempts < maxRetries) await new Promise(r => setTimeout(r, 500));
                continue;
            }

            const data = await response.json();
            const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return translatedText ? translatedText.trim() : "";
        } catch (error) {
            console.error(`Translation Network Error (Attempt ${attempts + 1}):`, error);
            attempts++;
            if (attempts < maxRetries) await new Promise(r => setTimeout(r, 500));
        }
    }

    return ""; // Failed after retries
};


// --- WebSocket Logic ---
const clients = new Set();
// DEEPGRAM_KEY already declared at top of file

// --- Helper: Broadcast to all connected clients ---
const broadcast = (data, isBinary = false) => {
    clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(data, { binary: isBinary });
        }
    });
};

// --- Helper: Generate TTS via Deepgram Aura-2 ---
const generateTTS = async (text) => {
    if (!text) return null;
    try {
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
        // Using REST API for "chunked" TTS (best for sentence-based translation)
        const response = await deepgram.speak.request(
            { text },
            {
                model: "aura-asteria-en", // Aura-2 English Voice
                encoding: "linear16", // Raw PCM or mp3. linear16 is good for AudioContext
                container: "wav",
            }
        );

        const stream = await response.getStream();
        if (stream) {
            // Convert stream to buffer
            const buffer = await streamToBuffer(stream);
            return buffer;
        }
        return null;
    } catch (e) {
        console.error("TTS Generation Error:", e);
        return null;
    }
};

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};


// --- WebSocket Logic ---
wss.on('connection', (ws) => {
    console.log('Client connected to Translation Server');
    clients.add(ws);

    let deepgramLive = null;
    let isSource = false; // Flag to identify if this is the Admin/Mic Source

    // Initialize Deepgram Connection
    try {
        const deepgram = createClient(DEEPGRAM_KEY);
        deepgramLive = deepgram.listen.live({
            model: "nova-2",
            language: "es",
            smart_format: true,
            interim_results: true,
            endpointing: 300,
        });

        // Deepgram Events
        deepgramLive.on(LiveTranscriptionEvents.Open, () => {
            console.log("Deepgram Connection OPEN");
        });

        deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
            const transcript = data.channel.alternatives[0].transcript;

            if (transcript && data.is_final) {
                // 1. Send Original Transcript immediately (Broadcast Text)
                const textMessage = {
                    type: 'TRANSCRIPTION',
                    original: transcript,
                    isFinal: true
                };

                // Translate
                const translated = await translateText(transcript, 'en');
                textMessage.translation = translated;

                // Broadcast JSON update to everyone (Admin + Visitors)
                broadcast(JSON.stringify(textMessage));

                // 2. Generate Audio (TTS) -> Broadcast Binary
                if (translated) {
                    const audioBuffer = await generateTTS(translated);
                    if (audioBuffer) {
                        broadcast(audioBuffer, true);
                    }
                }
            }
        });

        // ... Error handling ...
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


    ws.on('message', (message) => {
        // Assume only the "Source" (Admin) sends audio data
        // Visitors just listen
        if (deepgramLive && deepgramLive.getReadyState() === 1) {
            deepgramLive.send(message);
            isSource = true;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);

});
