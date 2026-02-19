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
                    resolve([]);
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

    // Try new ID: wvxf-dwi5
    const binUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=5&$order=novid DESC&bin=${bin}`;
    console.log(`Checking: ${binUrl}`);
    const binData = await fetchJson(binUrl);

    if (Array.isArray(binData)) {
        console.log("-> Found violations:", binData.length);
        if (binData.length > 0) console.log("-> Example:", binData[0].novdescription);
    } else {
        console.log("-> Response:", binData);
    }

    // Also verify complaints ID: erm2-nwe9
    const compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5&$order=created_date DESC&bin=${bin}`;
    console.log(`Checking: ${compUrl}`);
    const compData = await fetchJson(compUrl);
    if (Array.isArray(compData)) {
        console.log("-> Found complaints:", compData.length);
    } else {
        console.log("-> Response:", compData);
    }
}

testHPD();
