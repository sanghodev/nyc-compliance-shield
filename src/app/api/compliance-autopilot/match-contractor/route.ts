import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/compliance-autopilot/match-contractor
// Returns best-match contractors for a violation step's category
const CATEGORY_MAP: Record<string, string[]> = {
    'Plumbing': ['plumbing'],
    'Electrical': ['electrical'],
    'HVAC': ['hvac'],
    'Lead Abatement': ['lead_abatement'],
    'Mold': ['mold_remediation'],
    'General': ['general_contractor'],
    'Paperwork': ['general_contractor'],
    'Fire': ['fire_protection'],
    'Elevator': ['elevator'],
    'Roofing': ['roofing'],
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { step_category, borough } = body
    if (!step_category) return NextResponse.json({ error: 'Missing step_category' }, { status: 400 })

    // Map step category to DB contractor categories
    const dbCategories = CATEGORY_MAP[step_category] || ['general_contractor']

    let query = supabaseAdmin
        .from('contractors')
        .select('id, name, company_name, category, specializations, service_areas, phone, email, rating, total_reviews, total_jobs, verified, rate_type, rate_from, rate_to, bio')
        .eq('status', 'active')
        .in('category', dbCategories)
        .order('verified', { ascending: false })
        .order('rating', { ascending: false })
        .limit(5)

    // Filter by borough if provided
    if (borough) {
        query = query.contains('service_areas', [borough])
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If no results with borough filter, retry without
    if ((!data || data.length === 0) && borough) {
        const { data: fallback } = await supabaseAdmin
            .from('contractors')
            .select('id, name, company_name, category, specializations, service_areas, phone, email, rating, total_reviews, total_jobs, verified, rate_type, rate_from, rate_to, bio')
            .eq('status', 'active')
            .in('category', dbCategories)
            .order('rating', { ascending: false })
            .limit(5)
        return NextResponse.json({ data: fallback || [], borough_match: false })
    }

    return NextResponse.json({ data: data || [], borough_match: true })
}
