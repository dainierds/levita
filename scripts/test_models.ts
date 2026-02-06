
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY"; // I'll need to rely on the environment or user input if this is empty, but let's try reading the file.
// Actually, I can't easily read the .env file in this environment if it's not set in the shell.
// I will assume the key is in the .env file and try to read it using fs if dotenv doesn't pick it up automatically or just ask the user/check the codebase.
// Since I can't interactively ask for the key in a script run, I'll try to rely on the existing setup. 
// Wait, I can see the Previous view of vite.config.ts used `loadEnv`.
// Let's just try to create a simple script that assumes the key is passed or present.
// For now, I will hardcode a placeholder and ask the user if it fails, OR I can try to read the .env file myself in the script.

// Let's iterate. I'll read .env content first to get the key.
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let key = '';
try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        if (line.startsWith('VITE_GEMINI_API_KEY=')) {
            key = line.split('=')[1].trim();
            break;
        }
    }
} catch (e) {
    console.error("Could not read .env file");
}

if (!key) {
    console.error("API Key not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);
console.log(`Using API Key (first 5 chars): ${key.substring(0, 5)}...`);

async function listModels() {
    try {
        // The listModels method might be on the client or accessible differently.
        // Based on documentation, it's often not directly exposed in the high-level SDK for client-side use in the same way, 
        // but let's try to infer or use a known working model.
        // Actually, `gemini-pro` is usually safe. `gemini-1.5-flash` is newer.
        // Let's try to generate content with a few different model names to see which one works.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        console.log("Testing models...");

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log("SUCCESS ✅");
            } catch (e) {
                console.log(`FAILED ❌`);
                console.error(JSON.stringify(e, null, 2));
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
