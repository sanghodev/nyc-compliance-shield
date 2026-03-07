import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('properties').select('id, address, image').order('id', { ascending: false }).limit(5);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent 5 properties image URLs:');
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
