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
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function testHPD() {
    const bin = '4077074'; // 10031 Metropolitan Ave
    const housenumber = '10031';
    const streetname = 'METROPOLITAN AVENUE';

    console.log(`Testing HPD Violations API for BIN: ${bin}`);
    console.log(`Address: ${housenumber} ${streetname}`);

    try {
        // 1. Try BIN
        const binUrl = `https://data.cityofnewyork.us/resource/wvxf-dvoa.json?$limit=5&$order=novid DESC&bin=${bin}`;
        const binData = await fetchJson(binUrl);
        console.log(`\n[BIN Search] Found: ${binData.length} records`);
        if (binData.length > 0) {
            console.log("Sample:", binData[0].novdescription);
        } else {
            console.log("No records found via BIN.");
        }

        // 2. Try Address
        const addrUrl = `https://data.cityofnewyork.us/resource/wvxf-dvoa.json?$limit=5&$order=novid DESC&housenumber=${housenumber}&streetname=${encodeURIComponent(streetname)}`;
        const addrData = await fetchJson(addrUrl);
        console.log(`\n[Address Search] Found: ${addrData.length} records`);
        if (addrData.length > 0) {
            console.log("Sample:", addrData[0].novdescription);
        } else {
            console.log("No records found via Address.");
        }

        // 3. Try Status "Open"
        const openUrl = `https://data.cityofnewyork.us/resource/wvxf-dvoa.json?$limit=5&violationstatus=Open&bin=${bin}`;
        const openData = await fetchJson(openUrl);
        console.log(`\n[Open Status + BIN] Found: ${openData.length} records`);


    } catch (e) {
        console.error("Error:", e);
    }
}

testHPD();
