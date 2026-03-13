import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { verifyAuth } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/error-handler';

async function resetPasswordHandler(request: NextRequest) {
    // 1. VERIFY ADMIN PRIVILEGES
    const { user, error, status } = await verifyAuth(request, 'admin');
    if (error) {
        return NextResponse.json({ error }, { status });
    }

    const { target_id, new_password } = await request.json();

    if (!target_id || !new_password) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 2. RESET THE TARGET USER'S PASSWORD
    console.log(`[Reset Password] Privileges verified for admin ${user?.id}. Resetting password for target_id: ${target_id}`);
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        target_id,
        { password: new_password }
    );

    if (resetError) {
        throw resetError;
    }

    return NextResponse.json({ success: true, message: 'Password reset successful.' });
}

export const POST = withErrorHandler(resetPasswordHandler, 'ResetPassword');
