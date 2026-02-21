import { NextRequest, NextResponse } from 'next/server'

// Fetches Energy and Water Data Disclosure for Local Law 84
// Dataset: Energy Benchmarking (qb3v-bbre)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bbl = searchParams.get('bbl')
    const bin = searchParams.get('bin')

    if (!bbl && !bin) {
        return NextResponse.json({ error: 'Missing BBL or BIN parameter' }, { status: 400 })
    }

    const apiUrl = 'https://data.cityofnewyork.us/resource/qb3v-bbre.json'

    const params = new URLSearchParams()

    // bbl is 10 digits
    if (bbl && /^\d{10}$/.test(bbl)) {
        params.append('bbl_10_digits', bbl)
    } else if (bin) {
        params.append('nyc_borough_block_and_lot_bbl', bin) // Sometimes BIN is mistakenly used, or we fallback
    }

    // Get the most recent reporting years available in the API (order by year)
    params.append('$order', 'year_ending DESC')
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

        const result = {
            energy_star_score: item.energy_star_score || 'N/A',
            site_eui_kbtu_ft: item.site_eui_kbtu_ft || 'N/A',
            total_ghg_emissions: item.total_ghg_emissions_metric_tons_co2e || 'N/A',
            water_use_kgal: item.water_use_all_water_sources_kgal || 'N/A',
            reporting_year: item.year_ending || 'Unknown',
            compliance_status: item.compliance_status || 'Unknown'
        }

        return NextResponse.json({ data: result })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
