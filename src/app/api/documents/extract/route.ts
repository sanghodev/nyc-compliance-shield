import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EXTRACTION_PROMPT = `
You are a document analysis specialist for NYC real estate management.
Analyze this document and extract key information as structured JSON.

Return ONLY valid JSON in this exact format:
{
  "document_type": "lease|insurance|permit|tax|inspection|violation|certificate|contract|correspondence|other",
  "summary": "One-sentence summary of the document",
  "key_dates": [
    {"label": "Start Date", "date": "2026-01-01"},
    {"label": "Expiration Date", "date": "2027-01-01"}
  ],
  "parties": ["Party A", "Party B"],
  "amounts": [
    {"label": "Monthly Rent", "amount": "$2,500"}
  ],
  "important_clauses": [
    "Key clause or condition 1",
    "Key clause or condition 2"
  ],
  "expiration_date": "2027-01-01",
  "unit_number": "4B or null if not applicable"
}

If a field is not found, use null or empty array as appropriate.
For expiration_date: extract the most relevant expiration/renewal date.
`

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
    }

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { document_id, file_url, file_type, category, file_name } = body
    if (!document_id || !file_url) {
        return NextResponse.json({ error: 'Missing document_id or file_url' }, { status: 400 })
    }

    try {
        // Fetch file from storage URL
        const fileRes = await fetch(file_url)
        if (!fileRes.ok) throw new Error('Could not fetch document file')
        const fileBuffer = await fileRes.arrayBuffer()
        const base64Content = Buffer.from(fileBuffer).toString('base64')

        const mimeType = file_type || 'application/pdf'
        const ai = new GoogleGenAI({ apiKey })

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        { inlineData: { mimeType, data: base64Content } },
                    ]
                }
            ],
            config: { responseMimeType: 'application/json' },
        })

        let extracted: any = {}
        try {
            extracted = JSON.parse(response.text || '{}')
        } catch {
            extracted = { summary: 'AI could not parse this document.', document_type: category || 'other' }
        }

        // Update document in DB with extracted data
        const updateData: any = {
            ai_processed: true,
            ai_summary: extracted.summary || null,
            ai_key_dates: extracted.key_dates || [],
            ai_parties: extracted.parties || [],
            ai_amounts: extracted.amounts || [],
            ai_clauses: extracted.important_clauses || [],
        }

        // Auto-set category if AI detected it
        if (extracted.document_type && extracted.document_type !== 'other') {
            updateData.category = extracted.document_type
        }

        // Auto-set unit
        if (extracted.unit_number) {
            updateData.unit = extracted.unit_number
        }

        // Auto-set expiration date
        if (extracted.expiration_date) {
            const expDate = new Date(extracted.expiration_date)
            if (!isNaN(expDate.getTime())) {
                updateData.expires_at = expDate.toISOString()
            }
        }

        await supabaseAdmin
            .from('documents')
            .update(updateData)
            .eq('id', document_id)

        return NextResponse.json({ data: { document_id, extracted } })

    } catch (e: any) {
        // Mark as processed even if failed to avoid infinite retries
        await supabaseAdmin
            .from('documents')
            .update({ ai_processed: true, ai_summary: 'AI analysis failed.' })
            .eq('id', document_id)

        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
