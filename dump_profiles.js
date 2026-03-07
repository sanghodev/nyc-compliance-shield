const fs = require('fs');
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dumpProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, membership_tier');

    if (error) {
        fs.writeFileSync('all_profiles.json', JSON.stringify({ error }));
    } else {
        fs.writeFileSync('all_profiles.json', JSON.stringify({ data }, null, 2));
    }
}

dumpProfiles();
