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
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        })

        return JSON.parse(response.text || '{}')
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "models/text-embedding-004",
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
You specialize in NYC Multiple Dwelling Law (MDL), HPD/DOB compliance, and complex lease disputes. 
Your tone is professional, authoritative, and focused on risk mitigation.`,
    real_estate: `You are a top-tier NYC Property Management Strategist. 
You focus on operational efficiency, building maintenance trends (LL97, LL84), and tenant satisfaction. 
Your tone is analytical, forward-thinking, and business-oriented.`,
    tax: `You are a NYC Building Tax Specialist. 
You are an expert on NYC Department of Finance (DOF) assessments, property tax exemptions (421-a, J-51), and PILOT programs. 
Your tone is precise, detailed, and data-driven.`
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
            model: 'gemini-2.0-flash',
            contents: fullPrompt
        })
        return response.text || "I'm sorry, I couldn't generate a response."
    } catch (e: any) {
        console.error("Specialized Agent Error:", e)
        return "Specialized AI service is temporarily unavailable."
    }
}
