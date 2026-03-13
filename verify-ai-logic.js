
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const PERSONA_PROMPTS = {
    legal: `You are an elite NYC Housing Court Attorney. 
You specialize in NYC Multiple Dwelling Law (MDL), HPD/DOB compliance, and complex lease disputes. 
Your tone is professional, authoritative, and focused on risk mitigation.`,
    real_estate: `You are a top-tier NYC Property Management Strategist. 
You focus on operational efficiency, building maintenance trends (LL97, LL84), and tenant satisfaction. 
Your tone is analytical, forward-thinking, and business-oriented.`,
    tax: `You are a NYC Building Tax Specialist. 
You are an expert on NYC Department of Finance (DOF) assessments, property tax exemptions (421-a, J-51), and PILOT programs. 
Your tone is precise, detailed, and data-driven.`
};

async function testAnalyzeViolations(violations) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Analyze the following NYC violations and return JSON.
Violations: ${JSON.stringify(violations)}
Format: { "summary": "...", "risk_score": 0-100, "estimated_fines": "...", "critical_risks": [], "action_plan": [] }
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });

        console.log('analyzeViolations Result:', response.text);
    } catch (e) {
        console.error('analyzeViolations Error:', e.message);
    }
}

async function testSpecializedAgent(type, query) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const ai = new GoogleGenAI({ apiKey });
    const persona = PERSONA_PROMPTS[type] || PERSONA_PROMPTS.legal;
    const fullPrompt = `${persona}\n\nQUERY: ${query}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: fullPrompt
        });
        console.log(`Specialized Agent (${type}) Result:`, response.text);
    } catch (e) {
        console.error('askSpecializedAgent Error:', e.message);
    }
}

async function testEmbeddings(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text }] }
            })
        });
        const json = await res.json();
        if (json.embedding) {
            console.log('getEmbeddings Result: Success (Length: ' + json.embedding.values.length + ')');
        } else {
            console.log('getEmbeddings Result: Failed', JSON.stringify(json));
        }
    } catch (e) {
        console.error('getEmbeddings Error:', e.message);
    }
}

async function runAll() {
    console.log('Running AI Service Logic Verification...\n');
    await testAnalyzeViolations([{ description: 'Broken elevator', severity: 'Hazardous' }]);
    console.log('\n---\n');
    await testSpecializedAgent('legal', 'Summarize the tenant rights regarding rent stabilization in NYC in 3 bullet points.');
    console.log('\n---\n');
    await testEmbeddings('NYC Building Compliance');
}

runAll();
