import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import { getEmbeddings } from '@/lib/aiService'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { document_id } = await request.json()

        if (!document_id) {
            return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })
        }

        // 1. Fetch Document Metadata
        const { data: doc, error: docError } = await supabaseAdmin
            .from('documents')
            .select('*, properties(manager_id)')
            .eq('id', document_id)
            .single()

        if (docError || !doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        const managerId = doc.uploaded_by || doc.properties?.manager_id
        if (!managerId) {
            return NextResponse.json({ error: 'No owner found for document' }, { status: 400 })
        }

        // 1.1 Check Plan (Growth or higher)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('membership_tier, role')
            .eq('id', managerId)
            .single()

        const isPremium = ['Growth', 'Business', 'Admin'].includes(profile?.membership_tier || '') || profile?.role === 'admin'
        if (!isPremium) {
            return NextResponse.json({ success: true, message: 'Skipping indexing: Growth plan required for RAG education.' })
        }

        // 2. Fetch File from Storage
        let bucket = 'document-vault'
        let storagePath = doc.file_url.split('/' + bucket + '/')[1]?.split('?')[0]

        if (!storagePath) {
            return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })
        }

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from(bucket)
            .download(storagePath)

        if (downloadError || !fileData) {
            return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
        }

        const buffer = await fileData.arrayBuffer()
        const base64Content = Buffer.from(buffer).toString('base64')

        // 3. Extract Full Text using Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    parts: [
                        { text: "Extract the full word-for-word text content of this document. Preserve the original structure, clauses, and names. Do not summarize." },
                        { inlineData: { mimeType: doc.file_type || 'application/pdf', data: base64Content } }
                    ]
                }
            ]
        })

        const fullText = response.text || ""
        if (!fullText) {
            return NextResponse.json({ error: 'AI failed to extract text' }, { status: 500 })
        }

        // 4. Chunking
        const chunks = chunkText(fullText, 800)
        console.log(`Processing doc ${document_id}: ${chunks.length} chunks.`)

        // 5. Delete existing chunks for this doc (Idempotency)
        await supabaseAdmin.from('document_chunks').delete().eq('document_id', document_id)

        // 6. Embedding & Storage
        const results = []
        for (let i = 0; i < chunks.length; i++) {
            const content = chunks[i]
            try {
                const embedding = await getEmbeddings(content)
                const { error: insertError } = await supabaseAdmin
                    .from('document_chunks')
                    .insert({
                        document_id: doc.id,
                        manager_id: doc.uploaded_by || doc.manager_id, // Ensure we have the owner
                        content,
                        embedding,
                        metadata: {
                            chunk_index: i,
                            total_chunks: chunks.length,
                            file_name: doc.file_name
                        }
                    })

                if (insertError) console.error("Chunk Insert Error:", insertError)
                results.push({ index: i, success: !insertError })
            } catch (e) {
                console.error(`Embedding chunk ${i} failed:`, e)
            }
        }

        return NextResponse.json({
            success: true,
            total_chunks: chunks.length,
            indexed_chunks: results.filter(r => r.success).length
        })

    } catch (e: any) {
        console.error("Indexing Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

function chunkText(text: string, size: number) {
    const chunks: string[] = []
    const lines = text.split('\n')
    let current = ""

    for (const line of lines) {
        if ((current.length + line.length) > size && current.length > 0) {
            chunks.push(current.trim())
            current = ""
        }
        current += line + "\n"
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
}
