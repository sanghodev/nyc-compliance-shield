const https = require('https');

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: true, msg: 'parse_error' }); }
            });
        }).on('error', () => resolve({ error: true, msg: 'req_error' }));
    });
}

async function testAll() {
    const bin = '4077074';
    const bbl = '4032200019'; // 10031 Metropolitan

    // 1. Violations: wvxf-dwi5 (Confirmed BIN works)
    // 2. Complaints: erm2-nwe9
    {
        const url = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=1&bbl=${bbl}`;
        const data = await fetchJson(url);
        console.log(`Complaints (BBL): Found ${Array.isArray(data) ? data.length : 'Error'}`);
        if (!Array.isArray(data)) console.log(`  -> ${JSON.stringify(data)}`);
    }
    {
        // Try resolution_description or incident_address just in case BBL fails
        const url = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=1&incident_address=10031 METROPOLITAN AVENUE`;
        const data = await fetchJson(url);
        console.log(`Complaints (Address): Found ${Array.isArray(data) ? data.length : 'Error'}`);
    }

    // 3. Litigations: 59hk-4pe3
    {
        const url = `https://data.cityofnewyork.us/resource/59hk-4pe3.json?$limit=1&bin=${bin}`;
        const data = await fetchJson(url);
        console.log(`Litigations (BIN): Found ${Array.isArray(data) ? data.length : 'Error'}`);
        if (!Array.isArray(data)) console.log(`  -> ${JSON.stringify(data)}`);
    }

    // 4. Registration: tesw-yqqr
    {
        const url = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$limit=1&bin=${bin}`;
        const data = await fetchJson(url);
        console.log(`Registration (BIN): Found ${Array.isArray(data) ? data.length : 'Error'}`);
        if (!Array.isArray(data)) console.log(`  -> ${JSON.stringify(data)}`);
    }

    // 5. Charges: 7k4b-32z3
    {
        const url = `https://data.cityofnewyork.us/resource/7k4b-32z3.json?$limit=1&bin=${bin}`; // Charges might use BBL?
        const data = await fetchJson(url);
        console.log(`Charges (BIN): Found ${Array.isArray(data) ? data.length : 'Error'}`);
        if (!Array.isArray(data)) {
            // Try BBL
            const url2 = `https://data.cityofnewyork.us/resource/7k4b-32z3.json?$limit=1&bbl=${bbl}`;
            const data2 = await fetchJson(url2);
            console.log(`Charges (BBL): Found ${Array.isArray(data2) ? data2.length : 'Error'}`);
        }
    }
}
testAll();
