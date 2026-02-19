const https = require('https');

// Helper to fetch JSON
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error("Parse Error for URL:", url);
                    console.error("Raw Data:", data.substring(0, 100)); // Log first 100 chars
                    resolve([]); // Return empty array on parse error
                }
            });
        }).on('error', (e) => {
            console.error("Request Error:", e);
            resolve([]);
        });
    });
}

async function testHPD() {
    const bin = '4077074';

    // 1. Try BIN
    const binUrl = `https://data.cityofnewyork.us/resource/wvxf-dvoa.json?$limit=5&$order=novid DESC&bin=${bin}`;
    console.log(`Checking: ${binUrl}`);
    const binData = await fetchJson(binUrl);
    console.log(`[BIN Search] Result Type: ${typeof binData}`);
    console.log(`[BIN Search] Result Length: ${binData.length}`);

    if (Array.isArray(binData) && binData.length === 0) {
        console.log("-> No violations found for this BIN.");
    } else if (Array.isArray(binData)) {
        console.log("-> Found violations:", binData.length);
        console.log("-> Example:", JSON.stringify(binData[0], null, 2));
    } else {
        console.log("-> Unexpected response:", binData);
    }
}

testHPD();
