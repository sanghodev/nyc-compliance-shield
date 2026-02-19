import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const violations = body.violations || []
    if (violations.length === 0) {
        return NextResponse.json({ error: 'No violations provided for analysis' }, { status: 400 })
    }

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

        let analysisResult: any
        try {
            analysisResult = JSON.parse(response.text || '{}')
        } catch {
            analysisResult = {
                summary: 'AI generation failed to produce valid JSON.',
                risk_score: 0,
                estimated_fines: 'Unknown',
                critical_risks: ['AI Error'],
                action_plan: [],
            }
        }

        return NextResponse.json({ data: analysisResult })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
