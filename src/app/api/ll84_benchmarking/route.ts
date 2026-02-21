import { NextRequest, NextResponse } from 'next/server'

// Fetches Energy and Water Data Disclosure for Local Law 84
// Dataset: Energy Benchmarking 2022 (usc3-8zwd)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bbl = searchParams.get('bbl')

    if (!bbl) {
        return NextResponse.json({ error: 'Missing BBL parameter' }, { status: 400 })
    }

    const apiUrl = 'https://data.cityofnewyork.us/resource/usc3-8zwd.json'

    const params = new URLSearchParams()

    // bbl is 10 digits
    if (bbl && /^\d{10}$/.test(bbl)) {
        params.append('nyc_borough_block_and_lot_bbl', bbl)
    } else {
        return NextResponse.json({ error: 'Invalid BBL format' }, { status: 400 })
    }

    // Get the most recent reporting years available in the API (order by year)
    params.append('$limit', '1')

    try {
        const res = await fetch(`${apiUrl}?${params.toString()}`)
        if (!res.ok) {
            throw new Error(`NYC API returned ${res.status}`)
        }

        const data = await res.json()

        if (data.length === 0) {
            return NextResponse.json({ data: null, message: "No benchmarking data found for this property." })
        }

        const item = data[0]

        // Map to exact keys found in usc3-8zwd dataset
        const result = {
            energy_star_score: item.energy_star_score || 'N/A',
            site_eui: item.site_eui_kbtu_ft || 'N/A',
            ghg_emissions: item.total_ghg_emissions_metric_tons_co2e || 'N/A',
            water_use: item.metered_areas_water || 'N/A',
            reporting_year: item.year_ending || 'Unknown'
        }

        return NextResponse.json({ data: result })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
