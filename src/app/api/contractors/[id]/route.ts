import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/contractors/[id]/review — Submit a review
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const contractorId = parseInt(params.id)
    if (isNaN(contractorId)) {
        return NextResponse.json({ error: 'Invalid contractor ID' }, { status: 400 })
    }

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
        .from('contractor_reviews')
        .insert({
            contractor_id: contractorId,
            reviewer_id: user.id,
            property_id: body.property_id,
            rating: body.rating,
            review_text: body.review_text,
            job_category: body.job_category,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// PATCH /api/contractors/[id] — Admin: approve/suspend
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const contractorId = parseInt(params.id)

    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const allowed = ['status', 'verified', 'insurance_verified']
    const updates: any = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabaseAdmin
        .from('contractors')
        .update(updates)
        .eq('id', contractorId)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}
