import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const area = searchParams.get('area')
    const minRating = searchParams.get('min_rating')
    const search = searchParams.get('search')

    let query = supabaseAdmin
        .from('contractors')
        .select('*')
        .eq('status', 'active')
        .order('verified', { ascending: false })
        .order('rating', { ascending: false })

    if (category && category !== 'all') {
        query = query.eq('category', category)
    }
    if (area) {
        query = query.contains('service_areas', [area])
    }
    if (minRating) {
        query = query.gte('rating', parseFloat(minRating))
    }
    if (search) {
        query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
    // Contractor self-registration (status: pending → admin must approve)
    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const required = ['name', 'email', 'category']
    for (const field of required) {
        if (!body[field]) {
            return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
        }
    }

    const { data, error } = await supabaseAdmin
        .from('contractors')
        .insert({
            name: body.name,
            company_name: body.company_name,
            email: body.email,
            phone: body.phone,
            website: body.website,
            category: body.category,
            specializations: body.specializations || [],
            service_areas: body.service_areas || [],
            dob_license_number: body.dob_license_number,
            hic_license_number: body.hic_license_number,
            insurance_policy_number: body.insurance_policy_number,
            insurance_expires_at: body.insurance_expires_at,
            rate_type: body.rate_type,
            rate_from: body.rate_from,
            rate_to: body.rate_to,
            bio: body.bio,
            status: 'pending',          // Always starts pending
            verified: false,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Registration received. Our team will review and approve within 24 hours.' })
}
