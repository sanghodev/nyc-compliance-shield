const fs = require('fs');
fetch('https://data.cityofnewyork.us/resource/usc3-8zwd.json?$limit=1')
    .then(r => r.json())
    .then(d => {
        if (d.length > 0) {
            const keys = Object.keys(d[0]);
            console.log('BBL:', keys.find(k => k.includes('bbl')));
            console.log('Energy Star:', keys.find(k => k.includes('star')));
            console.log('EUI:', keys.find(k => k.includes('eui')));
            console.log('GHG:', keys.find(k => k.includes('ghg')));
            console.log('Water:', keys.find(k => k.includes('water')));
            console.log('Year:', keys.find(k => k.includes('year')));
        }
    });
