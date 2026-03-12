
import { analyzeViolations, askSpecializedAgent } from './src/lib/aiService';
import * as dotenv from 'dotenv';
dotenv.config();

async function runTests() {
    console.log('--- Testing analyzeViolations ---');
    const mockViolations = [
        {
            violation_id: 12345,
            description: 'FAIL TO MAINTAIN EXTERIOR WALLS',
            severity: 'HAZARDOUS',
            status: 'OPEN'
        }
    ];

    try {
        const analysis = await analyzeViolations(mockViolations);
        console.log('Analysis Result:', JSON.stringify(analysis, null, 2));
    } catch (err) {
        console.error('analyzeViolations failed:', err);
    }

    console.log('\n--- Testing askSpecializedAgent (legal) ---');
    try {
        const response = await askSpecializedAgent('legal', 'What is the penalty for HPD Class C violations?');
        console.log('Legal Agent Response:', response);
    } catch (err) {
        console.error('askSpecializedAgent (legal) failed:', err);
    }
}

runTests();
