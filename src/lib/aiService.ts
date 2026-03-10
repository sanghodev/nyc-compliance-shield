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
