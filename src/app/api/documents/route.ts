import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { verifyAuth, verifyPropertyAccess } from '@/lib/auth-utils'
import { withErrorHandler } from '@/lib/error-handler'

// GET /api/documents?property_id=X&category=lease&expiring=true
async function getDocumentsHandler(request: NextRequest) {
    const { user, error, status } = await verifyAuth(request)
    if (error) return NextResponse.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const category = searchParams.get('category')
    const expiringDays = searchParams.get('expiring_days')

    // Authorization check: User must have access to the property (if specific property is requested)
    if (propertyId) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user!.id).single()
        const hasAccess = await verifyPropertyAccess(user!.id, parseInt(propertyId), profile?.role || 'tenant')
        if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Default scoping if no propertyId is provided
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user!.id).single()
    if (profile?.role !== 'admin' && !propertyId) {
        const { data: props } = await supabaseAdmin.from('properties').select('id').eq('manager_id', user!.id)
        const propIds = (props || []).map((p: any) => p.id)
        if (propIds.length === 0) return NextResponse.json({ data: [] })
        query = query.in('property_id', propIds)
    }

    const { data, error: queryError } = await query
    if (queryError) throw queryError
    return NextResponse.json({ data })
}

// DELETE /api/documents?id=X
async function deleteDocumentHandler(request: NextRequest) {
    const { user, error, status } = await verifyAuth(request)
    if (error) return NextResponse.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Fetch doc to verify ownership
    const { data: doc, error: fetchErr } = await supabaseAdmin
        .from('documents').select('*').eq('id', parseInt(docId)).single()
    if (fetchErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user!.id).single()
    const hasAccess = await verifyPropertyAccess(user!.id, doc.property_id, profile?.role || 'tenant')
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete from Storage
    const filePath = doc.file_url.split('/document-vault/')[1]
    if (filePath) {
        await supabaseAdmin.storage.from('document-vault').remove([filePath])
    }

    // Delete from DB
    const { error: delErr } = await supabaseAdmin.from('documents').delete().eq('id', parseInt(docId))
    if (delErr) throw delErr

    return NextResponse.json({ success: true })
}

// PATCH /api/documents?id=X
async function patchDocumentHandler(request: NextRequest) {
    const { user, error, status } = await verifyAuth(request)
    if (error) return NextResponse.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await request.json()
    const allowed = ['category', 'notes', 'tags', 'unit', 'expires_at']
    const updates: any = {}
    for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    // Fetch doc to verify ownership
    const { data: doc } = await supabaseAdmin.from('documents').select('property_id').eq('id', parseInt(docId)).single()
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user!.id).single()
    const hasAccess = await verifyPropertyAccess(user!.id, doc.property_id, profile?.role || 'tenant')
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error: updateError } = await supabaseAdmin
        .from('documents').update(updates).eq('id', parseInt(docId)).select().single()
    if (updateError) throw updateError
    return NextResponse.json({ data })
}

export const GET = withErrorHandler(getDocumentsHandler, 'GetDocuments')
export const DELETE = withErrorHandler(deleteDocumentHandler, 'DeleteDocument')
export const PATCH = withErrorHandler(patchDocumentHandler, 'PatchDocument')
