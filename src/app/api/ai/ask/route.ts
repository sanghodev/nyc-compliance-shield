import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getEmbeddings, askSpecializedAgent } from '@/lib/aiService'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { type, query } = await request.json()

        if (!type || !query) {
            return NextResponse.json({ error: 'Missing type or query' }, { status: 400 })
        }

        // 1. Get User Session
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        // 2. Check User Plan/Tier
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('membership_tier, role')
            .eq('id', user.id)
            .single()

        const tier = profile?.membership_tier || 'Free'
        const role = profile?.role || 'user'
        const isPremium = ['Growth', 'Business', 'Admin'].includes(tier) || role === 'admin'

        let context = ""
        let sources: any[] = []

        // 3. If Premium, perform RAG (Vector Search)
        if (isPremium) {
            try {
                const queryEmbedding = await getEmbeddings(query)
                const { data: chunks, error: rpcError } = await supabaseAdmin.rpc('match_document_chunks', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.3, // Lowered threshold for better retrieval
                    match_count: 5,
                    p_manager_id: user.id
                })

                if (rpcError) {
                    console.error("Vector Search RPC Error:", rpcError)
                } else if (chunks && chunks.length > 0) {
                    context = chunks.map((c: any) => `[Source Doc #${c.document_id}]: ${c.content}`).join("\n---\n")
                    sources = chunks.map((c: any) => ({ document_id: c.document_id }))
                }
            } catch (e) {
                console.error("RAG Processing Error:", e)
                // Fallback to non-RAG if search fails
            }
        }

        // 4. Generate AI Response
        const response = await askSpecializedAgent(
            type as any,
            query,
            context,
            isPremium
        )

        return NextResponse.json({
            response,
            isPremium,
            usedContext: !!context,
            sources: sources.length > 0 ? Array.from(new Set(sources.map(s => s.document_id))) : []
        })

    } catch (e: any) {
        console.error("AI API Error:", e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
