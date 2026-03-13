import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    console.log("Upload API Runtime URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
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

    // Ensure bucket exists
    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
        if (listError) {
            console.error("CRITICAL: listBuckets failed:", listError)
        } else {
            console.log("Runtime Buckets:", buckets?.map(b => b.id))
            if (!buckets?.find(b => b.id === 'document-vault')) {
                console.log("Bucket 'document-vault' missing. Attempting creation...")
                const { error: createError } = await supabaseAdmin.storage.createBucket('document-vault', {
                    public: true,
                    fileSizeLimit: 52428800, // 50MB
                })
                if (createError) console.error("Bucket creation failed:", createError)
                else console.log("Bucket 'document-vault' created successfully.")
            }
        }
    } catch (e) {
        console.error("Unexpected error in bucket check:", e)
    }

    const { error: storageError } = await supabaseAdmin.storage
        .from('document-vault')
        .upload(storagePath, fileBytes, {
            contentType: file.type,
            upsert: false,
        })

    if (storageError) {
        console.error("UPLOAD PROCESS FAILED:", storageError)
        return NextResponse.json({
            error: `Storage Error: ${storageError.message}`,
            details: storageError
        }, { status: 500 })
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
    const extractUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/extract`
    console.log("Triggering extraction at:", extractUrl, "for doc:", doc.id)

    fetch(extractUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify({
            document_id: doc.id,
            file_url: urlData.publicUrl,
            file_type: file.type,
            category,
            file_name: file.name,
        }),
    }).then(res => {
        if (!res.ok) console.error("Extraction trigger failed status:", res.status)
        else console.log("Extraction triggered successfully for doc:", doc.id)
    }).catch(err => {
        console.error("Extraction trigger fetch error:", err.message)
    })

    return NextResponse.json({ data: doc, message: 'File uploaded. AI analysis starting...' })
}
