import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeViolations } from '@/lib/aiService'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getUserClient(authHeader: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
}

async function checkProTier(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from('profiles').select('membership_tier, role').eq('id', userId).single()
    if (data?.role === 'admin') return true
    return ['Starter', 'Growth', 'Business'].includes(data?.membership_tier || '')
}

// GET /api/compliance-autopilot?property_id=X
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getUserClient(authHeader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await checkProTier(user.id))) {
        return NextResponse.json({ error: 'Pro tier required', upgrade: true }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    if (!propertyId) return NextResponse.json({ error: 'Missing property_id' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('violation_resolutions')
        .select('*, contractors(id, name, company_name, category, phone, email, rating, verified)')
        .eq('property_id', parseInt(propertyId))
        .order('ai_risk_score', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// PATCH /api/compliance-autopilot — update step status or overall status
export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getUserClient(authHeader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await checkProTier(user.id))) {
        return NextResponse.json({ error: 'Pro tier required', upgrade: true }, { status: 403 })
    }

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { resolution_id, step_index, step_status, overall_status, resolution_notes, assigned_contractor_id } = body
    if (!resolution_id) return NextResponse.json({ error: 'Missing resolution_id' }, { status: 400 })

    // Fetch current resolution
    const { data: res, error: fetchErr } = await supabaseAdmin
        .from('violation_resolutions').select('*').eq('id', resolution_id).single()
    if (fetchErr || !res) return NextResponse.json({ error: 'Resolution not found' }, { status: 404 })

    const updates: any = {}

    // Update a specific step's status
    if (step_index !== undefined && step_status) {
        const plan = [...(res.ai_action_plan || [])]
        if (plan[step_index]) {
            plan[step_index] = { ...plan[step_index], status: step_status }
            updates.ai_action_plan = plan

            // Auto-advance current_step
            const completedSteps = plan.filter((s: any) => s.status === 'done').length
            updates.current_step = completedSteps

            // Auto-resolve if all steps done
            if (completedSteps === plan.length) {
                updates.overall_status = 'resolved'
                updates.resolved_at = new Date().toISOString()
            } else if (completedSteps > 0) {
                updates.overall_status = 'in_progress'
            }
        }
    }

    if (overall_status) updates.overall_status = overall_status
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes
    if (assigned_contractor_id !== undefined) updates.assigned_contractor_id = assigned_contractor_id

    const { data, error } = await supabaseAdmin
        .from('violation_resolutions')
        .update(updates)
        .eq('id', resolution_id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// POST /api/compliance-autopilot — Trigger AI analysis + save to DB
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getUserClient(authHeader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!(await checkProTier(user.id))) {
        return NextResponse.json({ error: 'Pro tier required', upgrade: true }, { status: 403 })
    }

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { property_id, violations } = body
    if (!property_id || !violations?.length) {
        return NextResponse.json({ error: 'Missing property_id or violations' }, { status: 400 })
    }

    // Call the AI service directly (no internal fetch)
    let analysis: any
    try {
        console.log("Analyzing violations for property:", property_id)
        analysis = await analyzeViolations(violations)
        console.log("AI Analysis Result Summary:", analysis?.summary)
    } catch (e: any) {
        console.error("AI Service Call Error:", e)
        return NextResponse.json({ error: `AI analysis service error: ${e.message}` }, { status: 500 })
    }

    if (!analysis || typeof analysis.risk_score === 'undefined') {
        return NextResponse.json({ error: 'AI analysis failed to generate risk score' }, { status: 500 })
    }

    const numericPropertyId = Number(property_id)

    // Upsert each violation into violation_resolutions
    const upserts = violations.map((v: any) => ({
        property_id: numericPropertyId,
        violation_id: v.violationid || v.id || String(Math.random()),
        violation_class: v.class,
        violation_description: v.description || v.novdescription,
        issued_date: v.novissueddate,
        agency: v.agency || 'HPD',
        ai_risk_score: analysis.risk_score,
        ai_summary: analysis.summary,
        ai_estimated_fines: analysis.estimated_fines,
        ai_critical_risks: analysis.critical_risks || [],
        ai_action_plan: (analysis.action_plan || []).map((a: any) => ({
            ...a,
            status: 'pending',
        })),
        overall_status: 'open',
        current_step: 0,
    }))

    const { data, error } = await supabaseAdmin
        .from('violation_resolutions')
        .upsert(upserts, { onConflict: 'property_id,violation_id' })
        .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, analysis })
}
