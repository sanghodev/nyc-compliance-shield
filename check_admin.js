require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, role');

    if (error) console.error('Error:', error);
    else console.table(data);
}

checkAdmin();
