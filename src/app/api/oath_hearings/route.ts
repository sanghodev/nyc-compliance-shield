import { NextRequest, NextResponse } from 'next/server'

// Fetches OATH Hearings and DOB ECB Violations
// Dataset: DOB ECB Violations (6bgk-3dad)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bbl = searchParams.get('bbl')

    if (!bbl) {
        return NextResponse.json({ error: 'Missing BBL parameter' }, { status: 400 })
    }

    if (!/^\d{10}$/.test(bbl)) {
        return NextResponse.json({ error: 'Invalid BBL format. Must be 10 digits.' }, { status: 400 })
    }

    const apiUrl = 'https://data.cityofnewyork.us/resource/6bgk-3dad.json'

    // According to DOB ECB, we can search by BBL directly.
    const params = new URLSearchParams({
        bbl: bbl,
        // Only get tickets that are active / unresolved or have a balance due.
        // The exact field name depends on the schema, but usually it's ticket_status or hearing_status.
        // To be safe, we fetch the most recent 20 tickets for this BBL.
        '$order': 'issue_date DESC',
        '$limit': '20',
    })

    try {
        const res = await fetch(`${apiUrl}?${params.toString()}`)
        if (!res.ok) {
            throw new Error(`NYC API returned ${res.status}`)
        }
        const data = await res.json()

        const results = data.map((item: any) => {
            return {
                id: item.ticket_number || item.ecb_violation_number,
                bbl: item.bbl,
                issue_date: item.issue_date,
                hearing_date: item.hearing_date,
                hearing_time: item.hearing_time,
                hearing_status: item.hearing_status,
                ticket_status: item.ticket_status,
                violation_type: item.violation_type || 'ECB Violation',
                severity: item.severity_class || item.infraction_code,
                penalty_balance: item.balance_due ? parseFloat(item.balance_due) : 0,
                description: item.violation_description || 'No description provided.',
                respondent: item.respondent_name
            }
        })

        return NextResponse.json({ data: results })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
