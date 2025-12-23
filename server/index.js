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
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// --- WebSocket Logic ---
const listeners = new Set(); // Store visitor clients

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const role = url.searchParams.get('role') || 'listener'; // Default to listener

    console.log(`Client connected as: ${role}`);

    if (role === 'listener') {
        listeners.add(ws);
        ws.on('close', () => listeners.delete(ws));
        return;
    }

    // --- Role: BROADCASTER (Admin) ---
    let deepgramLive = null;
    let segments = []; // Cache for history

    try {
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '59db582db173b1a1731cfcc90057241287203203'); // Fallback for safety
        deepgramLive = deepgram.listen.live({
            model: "nova-2",
            language: "es",
            smart_format: true,
            interim_results: true,
            endpointing: 300,
        });

        deepgramLive.on(LiveTranscriptionEvents.Open, () => console.log("Deepgram STT OPEN"));
        deepgramLive.on(LiveTranscriptionEvents.Close, () => console.log("Deepgram STT CLOSED"));
        deepgramLive.on(LiveTranscriptionEvents.Error, (e) => console.error("Deepgram Error:", e));

        deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
            const transcript = data.channel.alternatives[0].transcript;

            if (transcript && data.is_final) {
                // 1. Convert to Spanish -> English (Gemini)
                let translatedText = "";
                try {
                    translatedText = await translateText(transcript, 'en');
                } catch (trErr) {
                    console.error("Translation Critical Failure:", trErr);
                }

                // 2. Broadcast Text to Listeners
                const textMessage = JSON.stringify({
                    type: 'TRANSCRIPTION',
                    original: transcript,
                    translation: translatedText,
                    isFinal: true
                });
                listeners.forEach(client => {
                    if (client.readyState === 1) client.send(textMessage);
                });

                // 3. Sync to Firestore (For Projector/Legacy Clients)
                try {
                    // Maintain a small history
                    segments.push({ original: transcript, translation: translatedText });
                    if (segments.length > 10) segments.shift();

                    await db.collection('tenants').doc('default').collection('live').doc('transcription').set({
                        text: transcript,
                        translation: translatedText,
                        segments: segments,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                } catch (fsErr) {
                    console.error("Firestore Sync Error:", fsErr);
                }

                // 4. Generate Audio (Deepgram Aura TTS)
                if (translatedText) {
                    try {
                        const ttsResponse = await deepgram.speak.request(
                            { text: translatedText },
                            { model: "aura-asteria-en" }
                        );
                        const stream = await ttsResponse.getStream();

                        if (stream) {
                            const reader = stream.getReader();
                            // Stream chunks to listeners
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                listeners.forEach(client => {
                                    if (client.readyState === 1) client.send(value); // Send binary audio chunk
                                });
                            }
                        }
                    } catch (ttsError) {
                        console.error("TTS Error:", ttsError);
                    }
                }
            }
        });

    } catch (err) {
        console.error("Failed to init Deepgram:", err);
        ws.close();
        return;
    }

    ws.on('message', (message) => {
        if (deepgramLive && deepgramLive.getReadyState() === 1) {
            deepgramLive.send(message);
        }
    });

    ws.on('close', () => {
        console.log('Broadcaster disconnected');
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
