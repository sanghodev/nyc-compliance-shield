import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'Document generation service is temporarily unavailable' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { violation_details, correction_details, date_corrected } = body

    if (!violation_details || !correction_details) {
        return NextResponse.json({ error: 'Missing details' }, { status: 400 })
    }

    const prompt = `
You are an NYC Housing Attorney ("The Writer").
Draft a formal "Sworn Statement of Correction" (Affidavit) for the following HPD/DOB violation.
This text will be used in an official Certification of Correction form.

Violation Data:
${JSON.stringify(violation_details, null, 2)}

Correction Performed:
"${correction_details}" on date ${date_corrected}

Requirements:
1. Use formal legal language suitable for NYC HPD agencies.
2. State clearly that the violation has been corrected in compliance with the Housing Maintenance Code.
3. Include a placeholder for the Owner/Agent's signature.
4. Output ONLY the text of the affidavit, no markdown formatting or intro text.
`

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        })

        return NextResponse.json({ affidavit: response.text })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
