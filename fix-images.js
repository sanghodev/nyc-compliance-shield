require('dotenv').config();

async function fixBrokenImages() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/properties';
    const goodFallback = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300';

    const headers = {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    // 1. Get all properties that have "source.unsplash" or "maps.googleapis"
    const res = await fetch(url + '?select=id,image');
    const properties = await res.json();

    if (!properties || properties.error) {
        console.error("Error fetching properties", properties);
        return;
    }

    for (const p of properties) {
        if (p.image && (p.image.includes('source.unsplash.com') || p.image.includes('maps.googleapis'))) {
            const updateRes = await fetch(url + '?id=eq.' + p.id, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ image: goodFallback })
            });
            console.log(`Updated ${p.id}: ${updateRes.ok ? 'Success' : 'Fail'}`);
        }
    }
}
fixBrokenImages();
