
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { verifyAuth } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/error-handler';

// POST /api/ai/save-chat
async function saveChatHandler(request: NextRequest) {
    const { user, error, status } = await verifyAuth(request);
    if (error) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const { agent_type, messages, title } = body;

    if (!agent_type || !messages || !title) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error: insertError } = await supabaseAdmin
        .from('ai_consultations')
        .insert({
            user_id: user!.id,
            agent_type,
            messages,
            title
        })
        .select()
        .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data });
}

// GET /api/ai/save-chat (Fetch History)
async function getChatHistoryHandler(request: NextRequest) {
    const { user, error, status } = await verifyAuth(request);
    if (error) return NextResponse.json({ error }, { status });

    const { data, error: queryError } = await supabaseAdmin
        .from('ai_consultations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    return NextResponse.json({ success: true, data });
}

export const POST = withErrorHandler(saveChatHandler, 'SaveChat');
export const GET = withErrorHandler(getChatHistoryHandler, 'GetChatHistory');
