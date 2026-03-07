const fs = require('fs');
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function testReset() {
    const target_id = "bfbf5d2d-c4f0-40c3-9674-646c51e75368"; // admin1581@test.com
    const request_user_id = "7419e36f-8b7e-4896-9483-978e880a5853"; // donutscan@gmail.com

    console.log("Testing with admin ID:", request_user_id)

    const response = await fetch('http://localhost:3000/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            target_id,
            new_password: "TestPassword123!",
            request_user_id
        })
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
}

testReset();
