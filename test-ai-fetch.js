
const dotenv = require('dotenv');
dotenv.config();

async function testFetch() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey ? 'FOUND' : 'MISSING');
    if (!apiKey) return;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Say hello!' }]
                }]
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Failed:', err);
    }
}

testFetch();
