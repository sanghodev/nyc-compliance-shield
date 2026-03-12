
const dotenv = require('dotenv');
dotenv.config();

async function listValidModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY missing');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.models) {
            console.error('No models found in response:', data);
            return;
        }

        const validModels = data.models.filter(m => 
            m.supportedGenerationMethods.includes('generateContent')
        );

        console.log('Models supporting generateContent:');
        validModels.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (err) {
        console.error('Failed to list models:', err);
    }
}

listValidModels();
