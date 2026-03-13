import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        const { agent_type, title, messages } = await request.json()

        if (!agent_type || !messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Missing agent_type or messages' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('ai_chat_records')
            .insert([
                {
                    user_id: user.id,
                    agent_type,
                    title: title || `AI Consultation (${new Date().toLocaleDateString()})`,
                    messages
                }
            ])
            .select()
            .single()

        if (error) {
            console.error("DB Error saving chat:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        console.error("Save Chat API Error:", e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        const { data, error } = await supabaseAdmin
            .from('ai_chat_records')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("DB Error fetching chats:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        console.error("Get Chat API Error:", e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
