import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/documents/upload
// multipart/form-data: file, property_id, category (optional), unit (optional)
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

    // Pro-tier check
    const { data: profile } = await supabaseAdmin
        .from('profiles').select('membership_tier, role').eq('id', user.id).single()

    if (profile?.role === 'manager') {
        const tier = profile?.membership_tier || 'Free'
        if (!['Starter', 'Growth', 'Business'].includes(tier)) {
            return NextResponse.json(
                { error: 'Document Vault requires a Pro plan.', upgrade: true },
                { status: 403 }
            )
        }
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    const propertyId = formData.get('property_id') as string | null
    const category = (formData.get('category') as string) || 'other'
    const unit = formData.get('unit') as string | null

    if (!file || !propertyId) {
        return NextResponse.json({ error: 'Missing file or property_id' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${propertyId}/${timestamp}_${safeFileName}`

    const fileBytes = await file.arrayBuffer()
    const { error: storageError } = await supabaseAdmin.storage
        .from('document-vault')
        .upload(storagePath, fileBytes, {
            contentType: file.type,
            upsert: false,
        })

    if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from('document-vault')
        .getPublicUrl(storagePath)

    // Save metadata to DB
    const { data: doc, error: dbError } = await supabaseAdmin
        .from('documents')
        .insert({
            property_id: parseInt(propertyId),
            uploaded_by: user.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size_bytes: file.size,
            category,
            unit: unit || null,
            ai_processed: false,
        })
        .select()
        .single()

    if (dbError) {
        // Cleanup orphan storage file
        await supabaseAdmin.storage.from('document-vault').remove([storagePath])
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Trigger AI extraction asynchronously (don't await, return doc immediately)
    // The AI extraction will update the document in the background
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
            document_id: doc.id,
            file_url: urlData.publicUrl,
            file_type: file.type,
            category,
            file_name: file.name,
        }),
    }).catch(() => {/* fire and forget */ })

    return NextResponse.json({ data: doc, message: 'File uploaded. AI analysis starting...' })
}
