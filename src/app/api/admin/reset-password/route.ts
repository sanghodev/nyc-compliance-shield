import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        // Read .env file directly to get fresh environment variables
        // This bypasses the need to restart the Next.js dev server if .env was modified
        const envPath = path.resolve(process.cwd(), '.env');
        let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        try {
            if (fs.existsSync(envPath)) {
                const envFile = fs.readFileSync(envPath, 'utf8');
                const parsed = envFile.split('\n').reduce((acc, line) => {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) acc[match[1].trim()] = match[2].trim();
                    return acc;
                }, {} as Record<string, string>);

                if (parsed.NEXT_PUBLIC_SUPABASE_URL) supabaseUrl = parsed.NEXT_PUBLIC_SUPABASE_URL;
                if (parsed.SUPABASE_SERVICE_ROLE_KEY) serviceRoleKey = parsed.SUPABASE_SERVICE_ROLE_KEY;
            }
        } catch (e) {
            console.error("Failed to parse .env file:", e);
        }

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 });
        }

        // Use the Service Role Key to bypass RLS and act as an absolute administrator
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const { target_id, new_password, request_user_id } = await request.json();

        if (!target_id || !new_password || !request_user_id) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. VERIFY ADMIN PRIVILEGES
        // Check if the user making this request actually has the 'admin' role in the DB
        console.log(`[Reset Password] Verifying admin privileges for request_user_id: ${request_user_id}`);
        const { data: adminCheck, error: roleError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', request_user_id)
            .single();

        console.log(`[Reset Password] adminCheck result:`, adminCheck, `| Error:`, roleError);

        if (roleError || !adminCheck || adminCheck.role !== 'admin') {
            console.error(`[Reset Password] Authorization Failed! Expected admin role. Found: ${adminCheck?.role}`);
            return NextResponse.json({
                error: `Unauthorized. Only super administrators can reset passwords. Debug info: UID=${request_user_id}, DB_ROLE=${adminCheck?.role || 'null'}`
            }, { status: 403 });
        }

        // 2. RESET THE TARGET USER'S PASSWORD
        // We use the admin auth API to forcefully set the password
        console.log(`[Reset Password] Privileges verified. Resetting password for target_id: ${target_id}`);
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            target_id,
            { password: new_password }
        );

        if (error) {
            console.error("Supabase Admin Auth Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Password reset successful.' });

    } catch (err: any) {
        console.error("Reset Password Route Error:", err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
