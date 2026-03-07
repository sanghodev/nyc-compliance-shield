const fs = require('fs');
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role, id')
        .eq('email', 'donutscan@gmail.com')
        .single();

    if (error) {
        console.error(error)
    } else {
        console.log(data)
    }
}

checkAdmin();
