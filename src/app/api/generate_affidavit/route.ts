import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const body = await req.json();
        const { property, violation } = body;

        if (!property || !violation) {
            return NextResponse.json({ error: 'Missing property or violation details' }, { status: 400 });
        }

        const prompt = `
You are an expert NYC real estate attorney.
Your task is to draft a formal "Affidavit of Compliance" (or Certificate of Correction) for a property owner to submit to the NYC Department of Buildings (DOB) or Housing Preservation and Development (HPD).

Context:
Property Address: ${property.address}, NY
BIN: ${property.bin || 'N/A'}
BBL: ${property.bbl || 'N/A'}

Violation Details:
Description: ${violation.description || violation.issue || 'N/A'}
Violation Number/ID: ${violation.id || 'N/A'}
Issued Date: ${violation.date || 'N/A'}
Class: ${violation.class || 'N/A'}

Requirements:
1. The affidavit must be written in formal legal english, ready to be signed and notarized.
2. It should state that the owner (or authorized agent) has inspected the premises, hired a certified contractor, and that the specified violation has been completely corrected in accordance with all applicable NYC administrative codes.
3. Format the output strictly as clean, semantic HTML that can be rendered inside a web page. Use tags like <h1>, <h2>, <p>, <br/>, and <strong> for formatting.
4. Do NOT wrap the output in markdown \`\`\`html code blocks. Return ONLY the raw HTML string.
5. Include a formal signature block at the bottom for "Owner/Agent Signature", "Print Name", "Date", and a "Notary Public" section.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2, // Low temperature for more formal/predictable legal text
            }
        });

        const generatedHtml = response.text || '';
        const cleanHtml = generatedHtml.replace(/^```(html)?\n*/i, '').replace(/\n*```$/i, '').trim();

        return NextResponse.json({ affidavitHtml: cleanHtml });

    } catch (error: any) {
        console.error('Error generating affidavit:', error);
        return NextResponse.json(
            { error: 'Failed to generate affidavit', details: error.message },
            { status: 500 }
        );
    }
}
