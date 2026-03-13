import { GoogleGenAI } from '@google/genai'

export interface AIAnalysisResult {
    summary: string
    risk_score: number
    estimated_fines: string
    critical_risks: string[]
    action_plan: {
        step: number
        title: string
        description: string
        category: string
    }[]
}

export async function analyzeViolations(violations: any[]): Promise<AIAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured')
    }

    const ai = new GoogleGenAI({ apiKey })
    const prompt = `
You are an expert NYC Housing Attorney and Property Manager (The "Valid Legal Master").
Analyze the following list of NYC HPD/DOB violations for a specific property.

Violations Data:
${JSON.stringify(violations, null, 2)}

Your Task:
1. Analyze the severity and immediate risks (fines, vacates, tax lien sales).
2. Estimate the potential accumulated fines if left unresolved.
3. Create a step-by-step actionable plan to resolve these specific issues.
4. Provide a "Compliance Health Score" from 0 (Critical) to 100 (Perfect/No Issues).

Format your response strictly as valid JSON with the following structure:
{
  "summary": "A concise executive summary of the building's legal status (max 2 sentences).",
  "risk_score": 75,
  "estimated_fines": "$1,500 - $3,000",
  "critical_risks": ["Risk 1", "Risk 2"],
  "action_plan": [
    {
      "step": 1,
      "title": "Action Title",
      "description": "Detailed instruction on what to do.",
      "category": "Plumbing|Electrical|Paperwork|General"
    }
  ]
}
`

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 1000 
            },
        })

        const text = response.text
        if (!text) throw new Error('Empty response from AI')
        return JSON.parse(text)
    } catch (e: any) {
        // Handle Quota/Rate Limit errors (429 RESOURCE_EXHAUSTED)
        const errorMsg = e.message || ""
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            throw new Error("AI Quota Exceeded. The free tier of Gemini has reached its limit. Please wait 60 seconds or try again later.")
        }

        console.error("AI Service Error:", e)
        return {
            summary: 'AI generation failed: ' + (e.message || 'Unknown error'),
            risk_score: 0,
            estimated_fines: 'Unknown',
            critical_risks: ['AI Error'],
            action_plan: [],
        }
    }
}
export async function getEmbeddings(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] }
        })
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Embedding failed: ${res.status} ${JSON.stringify(errorData)}`);
    }

    const json = await res.json()
    return json.embedding.values
}

const PERSONA_PROMPTS = {
    legal: `You are an elite NYC Housing Court Attorney. 
Role: Ultra-concise advisor.
RULE: 3 Bullet points MAX. ONE short sentence per bullet. TOTAL < 50 words. Use Markdown. "간단명료".`,
    real_estate: `You are a top-tier NYC Property Management Strategist. 
Role: Ultra-concise advisor.
RULE: 3 Bullet points MAX. ONE short sentence per bullet. TOTAL < 50 words. Use Markdown. "간단명료".`,
    tax: `You are a NYC Building Tax Specialist. 
Role: Ultra-concise advisor.
RULE: 3 Bullet points MAX. ONE short sentence per bullet. TOTAL < 50 words. Use Markdown. "간단명료".`
}

export async function askSpecializedAgent(
    type: 'legal' | 'real_estate' | 'tax',
    query: string,
    context: string = "",
    isPremium: boolean = false
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

    const ai = new GoogleGenAI({ apiKey })
    const persona = PERSONA_PROMPTS[type] || PERSONA_PROMPTS.legal

    let fullPrompt = `${persona}\n\n`

    if (isPremium && context) {
        fullPrompt += `CONTEXT FROM USER DOCUMENTS:\n${context}\n\n`
        fullPrompt += `Use the context provided above to answer the following query. If the answer isn't in the context, refer to your general NYC knowledge but prioritize the context.\n\n`
    } else {
        fullPrompt += `Answer the following query based on your specialized NYC knowledge.\n\n`
    }

    fullPrompt += `QUERY: ${query}`

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: fullPrompt,
            config: {
                maxOutputTokens: 500,
                temperature: 0.1
            }
        })
        const text = response.text
        if (!text) throw new Error('Empty response from AI')
        return text
    } catch (e: any) {
        console.error("Specialized Agent Error:", e)
        return "Specialized AI service is temporarily unavailable."
    }
}
