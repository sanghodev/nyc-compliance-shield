const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load .env
dotenv.config();

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStorage() {
    const bucket = 'document-vault';
    const testFile = 'test.txt';
    const content = 'hello world';

    console.log(`Testing bucket: ${bucket}`);

    // 1. Check if exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets.find(b => b.id === bucket)) {
        console.error("Bucket NOT FOUND in listBuckets!");
        return;
    }
    console.log("Bucket found in list.");

    // 2. Try upload
    console.log("Attempting upload...");
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(testFile, Buffer.from(content), { upsert: true });

    if (uploadError) {
        console.error("Upload Error:", uploadError);
    } else {
        console.log("Upload Success:", uploadData);

        // 3. Try download
        console.log("Attempting download...");
        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
            .from(bucket)
            .download(testFile);

        if (downloadError) {
            console.error("Download Error:", downloadError);
        } else {
            console.log("Download Success. Size:", downloadData.size);

            // 4. Try delete
            console.log("Attempting delete...");
            const { error: deleteError } = await supabaseAdmin.storage
                .from(bucket)
                .remove([testFile]);
            if (deleteError) console.error("Delete Error:", deleteError);
            else console.log("Delete Success.");
        }
    }
}

testStorage();
