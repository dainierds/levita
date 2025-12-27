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
// Fix: Allow reading VITE_ prefixed key (common in shared .env files)
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!DEEPGRAM_KEY || !GEMINI_KEY) {
    console.error("CRITICAL: Missing API Keys. Check .env (Need GEMINI_API_KEY or VITE_GEMINI_API_KEY)");
}

// Initialize Gemini
// const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// DIAGNOSTIC STARTUP TEST
(async () => {
    console.log("🔍 Testing Gemini API Key & Model Availability...");
    const models = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);

    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            console.log(`✅ Model ${m}: WORKING (Response: ${response.text().trim()})`);
        } catch (e) {
            console.error(`❌ Model ${m}: FAILED. Reason: ${e.message}`);
        }
    }
})();

// --- debug: List Models on Startup ---


// O usar una función simple de detección basada en palabras comunes (más rápido para tiempo real)
const isSpanishData = (text) => {
    // Lista ampliada de palabras comunes en español que casi nunca aparecen en inglés
    const spanishCommons = [
        ' de ', ' la ', ' que ', ' el ', ' en ', ' y ', ' a ', ' los ', ' se ', ' del ',
        ' por ', ' un ', ' una ', ' con ', ' no ', ' su ', ' es ', ' al ', ' lo ', ' como ',
        ' más ', ' pero ', ' sus ', ' le ', ' ya ', ' o ', ' porque ', ' muy ', ' sin ', ' sobre ',
        ' dios ', ' jesús ', ' señor ', ' gloria ', ' santo ', ' amén ', ' aleluya ', ' iglesia '
    ];

    const englishCommons = [
        ' the ', ' to ', ' and ', ' of ', ' a ', ' in ', ' that ', ' is ', ' for ',
        ' on ', ' with ', ' as ', ' it ', ' be ', ' are ', ' was ', ' but ', ' not '
    ];

    let spanCount = 0;
    let engCount = 0;
    const lowerText = " " + text.toLowerCase() + " "; // Padding para coincidencia exacta

    spanishCommons.forEach(word => { if (lowerText.includes(word)) spanCount++; });
    englishCommons.forEach(word => { if (lowerText.includes(word)) engCount++; });

    // CRITERIOS MÁS ESTRICTOS (DISABLED FOR DEBUG v1.3)
    // 1. Si hay palabras en español y CERO palabras claras en inglés -> Es Español.
    // if (spanCount > 0 && engCount === 0) return true;

    // 2. Si gana el español por margen -> Es Español.
    // if (spanCount > engCount) return true;

    return false; // Always allow content in v1.3
}

const callGemini = async (inputText, systemInstruction) => {
    // SWITCH TO STABLE MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

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
            frequencyPenalty: 0.1, // Reduced for 1.5-flash compatibility
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Gemini API Error (${response.status}):`, errText);
            return null;
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Log Safety Ratings if blocked
        if (!text && data.promptFeedback) {
            console.warn("⚠️ Gemini Safety Block:", data.promptFeedback);
        }

        // Clean up common prefixes
        return text.replace(/^(Translation:|Output:|English:|Correction:)/i, "").trim();
    } catch (e) {
        console.error("Gemini Network Error:", e);
        return null;
    }
};


const translateText = async (text, targetLanguage) => {
    if (!text) return "";

    // 1. Prompt Robusto con Ejemplos (Few-Shot) - AÚN MÁS REFORZADO
    const systemPrompt = `
    Role: Professional Interpreter.
    TASK: Translate Spanish input to English text.
    
    CRITICAL RULES:
    1. OUTPUT MUST BE ENGLISH ONLY.
    2. NEVER repeat the Spanish input.
    3. NEVER explain ("The speaker says..."). Just translate.
    4. If input is unintelligible, output nothing.
    
    ### EXAMPLES ###
    Input: "Dios es bueno." -> Output: "God is good."
    Input: "Vamos a leer la palabra." -> Output: "Let us read the word."
    Input: "Aleluya." -> Output: "Hallelujah."
    `;

    // First Attempt
    let translated = await callGemini(text, systemPrompt);

    // Normalización para comparaciones
    const cleanInput = text.trim().toLowerCase();
    const cleanOutput = (translated || "").trim().toLowerCase();

    // 2. EL GUARDRAIL (La Verificación)
    let failed = false;

    // A. Chequeo de "Eco" (DISABLED for Debug v1.3)
    // if (cleanOutput === cleanInput || (cleanOutput.length > 5 && cleanInput.includes(cleanOutput))) {
    //     console.warn("⚠️ ALERTA: La IA repitió el input (Efecto Eco).");
    //     failed = true;
    // }

    // B. Chequeo de idioma (DISABLED for Debug v1.3)
    // if (translated && isSpanishData(translated)) {
    //     console.warn("⚠️ ALERTA: La IA respondió en español.");
    //     failed = true;
    // }

    // SI FALLÓ ALGUNA COMPROBACIÓN -> REINTENTO
    if (failed) {
        console.log("🔄 Reintentando traducción con prompt correctivo...");

        // ESTRATEGIA DE RECUPERACIÓN: Prompt explícito de corrección
        const retryPrompt = `
        ERROR: You outputted Spanish or repeated the input. 
        CORRECT IMMEDIATELY. 
        Translate this to English: "${text}"
        Output ONLY the English translation.
        `;

        translated = await callGemini(text, retryPrompt); // Note: passing as input, system prompt ignored/less relevant here? Actually callGemini uses both. 
        // Ideally we pass retryPrompt as SYSTEM instruction or input. 
        // In my logic `callGemini` takes (inputText, systemInstruction).
        // I should call it like: callGemini(text, retryPromptAsSystem) OR callGemini(text, systemPromptWithRetryInstruction).
        // The user code snippet: `translatedText = await callAI(retryPrompt, systemPrompt);`
        // Wait, `retryPrompt` in user snippet CONTAINS the input text.
        // My `callGemini` wraps input in tags.
        // So correct usage: callGemini(text, `SYSTEM ALERT...`)

    }

    // Re-verify after retry
    if (translated) {
        const retryOutput = translated.trim().toLowerCase();
        if (isSpanishData(translated) || retryOutput === cleanInput) {
            console.error("❌ FALLO CRÍTICO: Imposible traducir segmento. Silenciando salida.");
            return ""; // Fallback to empty
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
                console.log("🎤 Transcript Received:", transcript); // DEBUG

                // 1. Send Original Transcript immediately (Broadcast Text)
                const textMessage = {
                    type: 'TRANSCRIPTION',
                    original: transcript,
                    isFinal: true
                };

                // Translate
                console.log("🔄 Translator called for:", transcript.substring(0, 20) + "..."); // DEBUG
                const translated = await translateText(transcript, 'en');
                console.log("✅ Translation Result:", translated); // DEBUG

                // If filtered, send a placeholder so UI validates connection
                textMessage.translation = translated || "[...]";

                // Broadcast JSON update to everyone (Admin + Visitors)
                broadcast(JSON.stringify(textMessage));

                if (!translated) {
                    console.warn("⚠️ Translation filtered (Spanish/Echo), sent '[...]' placeholder.");
                }

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
    console.log("🚀 Server v1.4 (Gemini Stable 1.5) Starting...");
    res.send('Levita Audio Server is Running (Deepgram + Gemini 1.5-flash) v1.4');
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
