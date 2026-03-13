
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Models:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('List Models Failed:', err);
    }
}

listModels();
