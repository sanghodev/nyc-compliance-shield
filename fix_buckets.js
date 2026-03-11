const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBuckets() {
    console.log("Checking buckets...");
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
        console.error("Error listing buckets:", listError);
        return;
    }

    console.log("Current buckets:", buckets.map(b => b.id));

    const required = ['document-vault', 'property_verifications'];

    for (const bucketId of required) {
        const bucket = buckets.find(b => b.id === bucketId);
        if (!bucket) {
            console.log(`Creating ${bucketId} bucket (public: true)...`);
            const { error } = await supabaseAdmin.storage.createBucket(bucketId, {
                public: true,
                fileSizeLimit: 52428800
            });
            if (error) console.error(`Error creating ${bucketId}:`, error);
            else console.log(`${bucketId} created successfully as public.`);
        } else {
            console.log(`${bucketId} already exists. Updating to public: true...`);
            const { error } = await supabaseAdmin.storage.updateBucket(bucketId, {
                public: true
            });
            if (error) console.error(`Error updating ${bucketId}:`, error);
            else console.log(`${bucketId} updated to public.`);
        }
    }
}

fixBuckets();
