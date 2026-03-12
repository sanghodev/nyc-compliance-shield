
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey ? 'FOUND' : 'MISSING');
    if (!apiKey) return;

    try {
        const ai = new GoogleGenAI({ apiKey });
        console.log('AI instance created');
        
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Say hello!'
        });
        console.log('Response:', result.text);
    } catch (err) {
        console.error('Test Failed:', err);
    }
}

test();
