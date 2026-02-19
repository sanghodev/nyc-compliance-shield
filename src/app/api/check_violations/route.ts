import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bbl = searchParams.get('bbl')

    if (!bbl) {
        return NextResponse.json({ error: 'Missing BBL parameter' }, { status: 400 })
    }

    if (!/^\d{10}$/.test(bbl)) {
        return NextResponse.json({ error: 'Invalid BBL format. Must be 10 digits.' }, { status: 400 })
    }

    // Split BBL: Borough(1) + Block(5) + Lot(4)
    const boroid = bbl[0]
    const block = String(parseInt(bbl.substring(1, 6)))
    const lot = String(parseInt(bbl.substring(6, 10)))

    const apiUrl = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json'
    const params = new URLSearchParams({
        boroid,
        block,
        lot,
        violationstatus: 'Open',
        '$order': 'novissueddate DESC',
        '$limit': '50',
    })

    try {
        const res = await fetch(`${apiUrl}?${params.toString()}`)
        if (!res.ok) {
            throw new Error(`NYC API returned ${res.status}`)
        }
        const data = await res.json()

        const results = data.map((item: any) => {
            const vClass = item.class || 'A'
            let risk: 'A' | 'B' | 'C' = 'A'
            if (vClass === 'B') risk = 'B'
            else if (vClass === 'C' || vClass === 'I') risk = 'C'

            return {
                violationid: item.violationid,
                bbl,
                class: vClass,
                risk,
                novissueddate: item.novissueddate,
                description: item.novdescription,
                status: item.violationstatus,
            }
        })

        return NextResponse.json({ data: results })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
