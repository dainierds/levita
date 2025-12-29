import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    process.exit(1);
}

console.log("🔑 Testing API Key:", key.substring(0, 5) + "...");

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp"
];

const runTest = async () => {
    /* 
       Note: The google-generative-ai SDK usually abstracts endpoints.
       We will try to generate a simple "Hello" with each model.
    */
    const genAI = new GoogleGenerativeAI(key);

    for (const modelName of modelsToTest) {
        console.log(`\nTesting Model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS (${modelName}): "${text.trim()}"`);
        } catch (error) {
            console.error(`❌ FAILED (${modelName}):`, error.message);
        }
    }
};

runTest();
