const https = require('https');

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

async function verify() {
    const query = "10031 Metropolitan";
    console.log(`1. Searching for: "${query}"...`);

    try {
        // 1. GeoSearch
        const searchUrl = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(query)}`;
        const searchData = await fetchJson(searchUrl);

        if (!searchData.features || searchData.features.length === 0) {
            console.error("❌ No results found in GeoSearch.");
            return;
        }

        const feature = searchData.features[0];
        const bin = feature.properties.pad_bin || feature.properties.bin;
        const label = feature.properties.label;

        console.log(`✅ Found Address: ${label}`);
        console.log(`✅ Extracted BIN: ${bin}`);

        if (!bin) {
            console.error("❌ BIN is missing from GeoSearch result.", feature.properties);
            return;
        }

        // 2. HPD Violations
        console.log(`2. Fetching Violations for BIN: ${bin}...`);
        const vioUrl = `https://data.cityofnewyork.us/resource/wvxf-dvoa.json?$limit=5&$order=novid DESC&bin=${bin}`;
        const violations = await fetchJson(vioUrl);

        console.log(`✅ Violations Found: ${violations.length}`);
        if (violations.length > 0) {
            console.log("   First Violation:", violations[0].novdescription);
        } else {
            console.log("   (No open violations, which is good!)");
        }

        // 3. Complaints
        console.log(`3. Fetching Complaints for BIN: ${bin}...`);
        const compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5&$order=created_date DESC&bin=${bin}`;
        const complaints = await fetchJson(compUrl);

        console.log(`✅ Complaints Found: ${complaints.length}`);
        if (complaints.length > 0) {
            console.log("   First Complaint:", complaints[0].complaint_type);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

verify();
