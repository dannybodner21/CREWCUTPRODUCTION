// Test the API endpoint directly
require('dotenv').config({ path: '.env.local' });

async function testAPI() {
    const params = {
        jurisdictionName: 'Phoenix city',
        stateCode: 'AZ',
        serviceArea: 'Citywide',
        projectType: 'Residential',
        useSubtype: 'Single Family',
        numUnits: 100,
        squareFeet: 10000,
        projectValue: 100000,
        meterSize: '6"'
    };

    console.log('Testing API with params:', params);

    try {
        const response = await fetch('http://localhost:3000/api/lewis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'calculateProjectFees',
                params: params
            })
        });

        const result = await response.json();
        console.log('\nAPI Response:');
        console.log('Success:', result.success);

        if (result.success) {
            console.log('Total Fees:', result.data.fees?.length || 0);
            console.log('One-time:', result.data.oneTimeFees);
            console.log('Monthly:', result.data.monthlyFees);
            console.log('First Year:', result.data.firstYearTotal);
        } else {
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

testAPI();
