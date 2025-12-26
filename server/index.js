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


const isSpanishData = (text) => {
    if (!text) return false;
    const spanishCommons = [' de ', ' la ', ' que ', ' el ', ' en ', ' y ', ' a ', ' los ', ' se ', ' del '];
    const englishCommons = [' the ', ' to ', ' and ', ' of ', ' a ', ' in ', ' that ', ' is ', ' for '];

    let spanCount = 0;
    let engCount = 0;
    const lowerText = " " + text.toLowerCase() + " ";

    spanishCommons.forEach(word => { if (lowerText.includes(word)) spanCount++; });
    englishCommons.forEach(word => { if (lowerText.includes(word)) engCount++; });

    return spanCount > engCount && spanCount >= 2;
};

const callGemini = async (inputText, systemInstruction) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Construct Prompt with Examples (Few-Shot) and Delimiters
    const finalPrompt = `
    ${systemInstruction}
    
    <text_to_translate>
    ${inputText}
    </text_to_translate>
    `;

    const payload = {
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
            frequencyPenalty: 0.5, // Strategies 4: Penalize repetition
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) return null;

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Clean up common prefixes
        return text.replace(/^(Translation:|Output:|English:)/i, "").trim();
    } catch (e) {
        console.error("Gemini Call Error:", e);
        return null;
    }
};


const translateText = async (text, targetLanguage) => {
    if (!text) return "";

    // 1. Robust System Prompt (Strategy 1 & 2)
    const systemPrompt = `
    Role: You are a professional simultaneous interpreter for a church service.
    Task: Translate the user input from Spanish to English immediately.
    Tone: Solemn, biblical, and respectful.

    RULES:
    1. Output MUST be in English only.
    2. If the input is Spanish, translate it.
    3. If the input is English, output it exactly as is.
    4. Never explain the text, just translate.

    EXAMPLES:
    User: "Dios es bueno todo el tiempo."
    Assistant: "God is good all the time."

    User: "Hermanos, abran sus biblias."
    Assistant: "Brothers and sisters, open your bibles."
    `;

    // First Attempt
    let translated = await callGemini(text, systemPrompt);

    // 2. Guardrail Check (Strategy for Safety)
    if (translated && isSpanishData(translated)) {
        console.warn("⚠️ ALERTA: La IA respondió en español. Reintentando...");

        // Strategy 3: Retry with Aggressive Prompt
        const retryInstruction = `SYSTEM ALERT: You failed previous instruction. OUTPUT MUST BE ENGLISH ONLY. TRANSLATE THIS IMMEDIATELY:`;
        translated = await callGemini(text, retryInstruction);

        // Final Check
        if (translated && isSpanishData(translated)) {
            console.error("❌ FALLO CRÍTICO: Traducción fallida.");
            return ""; // Fallback to empty to avoid showing Spanish
        }
    }

    return translated || "";
};


// --- WebSocket Logic ---
const clients = new Set();
// DEEPGRAM_KEY already declared at top of file

// --- Helper: Broadcast to all connected clients ---
const broadcast = (data, isBinary = false) => {
    // Safety Check: Don't send Objects as strings (e.g. [object Blob])
    if (typeof data === 'object' && !Buffer.isBuffer(data) && !isBinary) {
        console.warn("Attempted to broadcast non-Buffer object as text:", data);
        return;
    }

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

// --- YouTube API: Get Live Video ID ---
app.get('/api/youtube/status', async (req, res) => {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: 'Missing channelId' });

    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
        console.error("Missing YOUTUBE_API_KEY in .env");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&eventType=live&type=video&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            return res.json({ status: 'live', videoId });
        } else {
            return res.json({ status: 'offline' });
        }
    } catch (error) {
        console.error("YouTube API Error:", error);
        res.status(500).json({ error: 'Failed to fetch YouTube status' });
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Gemini AI: Enabled');
});
