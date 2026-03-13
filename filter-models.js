
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('models_list.txt', 'utf8'));

const generateContentModels = data.models.filter(m => 
    m.supportedGenerationMethods.includes('generateContent')
);

console.log('Models supporting generateContent:');
generateContentModels.forEach(m => {
    console.log(`- ${m.name} (${m.displayName})`);
});
