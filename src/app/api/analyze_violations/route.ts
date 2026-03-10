import { NextRequest, NextResponse } from 'next/server'
import { analyzeViolations } from '@/lib/aiService'

export async function POST(request: NextRequest) {
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

    try {
        const analysisResult = await analyzeViolations(violations)
        return NextResponse.json({ data: analysisResult })
    } catch (e: any) {
        console.error("Analyze Violations Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
