const fs = require('fs');
require('dotenv').config();

async function check() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/properties?select=id,address,image&order=id.desc&limit=5';
    const res = await fetch(url, {
        headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
    });
    const data = await res.json();
    fs.writeFileSync('output2.json', JSON.stringify(data, null, 2), 'utf-8');
}

check();
