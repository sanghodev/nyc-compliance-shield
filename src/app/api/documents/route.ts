import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getUserClient(authHeader: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
}

// GET /api/documents?property_id=X&category=lease&expiring=true
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getUserClient(authHeader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const category = searchParams.get('category')
    const expiringDays = searchParams.get('expiring_days') // e.g. 30

    let query = supabaseAdmin
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

    if (propertyId) query = query.eq('property_id', parseInt(propertyId))
    if (category && category !== 'all') query = query.eq('category', category)
    if (expiringDays) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() + parseInt(expiringDays))
        query = query
            .not('expires_at', 'is', null)
            .lte('expires_at', cutoff.toISOString())
            .gte('expires_at', new Date().toISOString())
    }

    // Scope to manager's properties
    const { data: profile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
        // Get manager's property IDs
        const { data: props } = await supabaseAdmin
            .from('properties').select('id').eq('manager_id', user.id)
        const propIds = (props || []).map((p: any) => p.id)
        if (propIds.length === 0) return NextResponse.json({ data: [] })
        query = query.in('property_id', propIds)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}

// DELETE /api/documents?id=X
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = getUserClient(authHeader)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch doc to get file_url
    const { data: doc, error: fetchErr } = await supabaseAdmin
        .from('documents').select('*').eq('id', parseInt(docId)).single()
    if (fetchErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Delete from Storage
    const filePath = doc.file_url.split('/document-vault/')[1]
    if (filePath) {
        await supabaseAdmin.storage.from('document-vault').remove([filePath])
    }

    // Delete from DB
    const { error: delErr } = await supabaseAdmin
        .from('documents').delete().eq('id', parseInt(docId))
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    return NextResponse.json({ success: true })
}

// PATCH /api/documents?id=X — update metadata (category, notes, tags)
export async function PATCH(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const allowed = ['category', 'notes', 'tags', 'unit', 'expires_at']
    const updates: any = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabaseAdmin
        .from('documents').update(updates).eq('id', parseInt(docId)).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
}
