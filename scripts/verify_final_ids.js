const https = require('https');

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve({ error: true }); }
            });
        }).on('error', () => resolve({ error: true }));
    });
}

async function finalTest() {
    const bin = '4077074';        // 10031 Metropolitan
    const bbl = '4032200019';     // 10031 Metropolitan

    // 1. Violations (Correct ID: wvxf-dwi5)
    const vioUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=1&bin=${bin}`;
    const vio = await fetchJson(vioUrl);
    console.log(`Violations (BIN): ${Array.isArray(vio) ? vio.length : 'Error'}`);

    // 2. Complaints (Correct ID: erm2-nwe9, use BBL)
    const compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=1&bbl=${bbl}`;
    const comp = await fetchJson(compUrl);
    console.log(`Complaints (BBL): ${Array.isArray(comp) ? comp.length : 'Error'}`);

    // 3. Litigations (Correct ID: 59kj-x8nc) - Check params
    // Try BIN
    let litUrl = `https://data.cityofnewyork.us/resource/59kj-x8nc.json?$limit=1&bin=${bin}`;
    let lit = await fetchJson(litUrl);
    console.log(`Litigations (BIN): ${Array.isArray(lit) ? lit.length : 'Error'}`);
    if (!Array.isArray(lit) || lit.length === 0) {
        // Try BBL?
        litUrl = `https://data.cityofnewyork.us/resource/59kj-x8nc.json?$limit=1&bbl=${bbl}`;
        lit = await fetchJson(litUrl);
        console.log(`Litigations (BBL): ${Array.isArray(lit) ? lit.length : 'Error'}`);
    }

    // 4. Registration (ID: tesw-yqqr)
    const regUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$limit=1&bin=${bin}`;
    const reg = await fetchJson(regUrl);
    console.log(`Registration (BIN): ${Array.isArray(reg) ? reg.length : 'Error'}`);
}

finalTest();
