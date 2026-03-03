import { GoogleGenAI } from '@google/genai';

async function test() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        console.log("SDK initialized. Testing generateContent...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'Say hello!',
            config: { responseMimeType: 'application/json' },
        });
        console.log("Response:", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
