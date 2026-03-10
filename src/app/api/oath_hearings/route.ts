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

    // BBL is 10 digits: Boro(1) + Block(5) + Lot(4)
    const boro = bbl.substring(0, 1)
    const block = bbl.substring(1, 6)
    const lot = bbl.substring(6, 10)

    const params = new URLSearchParams({
        boro: boro,
        block: block,
        lot: lot,
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
