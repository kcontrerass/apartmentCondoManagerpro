const https = require('https');
const fs = require('fs');
const path = require('path');

// Function to load env file manually since we are running standalone
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found at', envPath);
        return {};
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
    return env;
}

const env = loadEnv();
const PUBLIC_KEY = env.RECURRENTE_PUBLIC_KEY;
const SECRET_KEY = env.RECURRENTE_SECRET_KEY;

console.log('🔍 Diagnostics:');
console.log('--------------------------------------------------');
if (!PUBLIC_KEY) console.error('❌ RECURRENTE_PUBLIC_KEY is MISSING in .env');
else console.log(`✅ RECURRENTE_PUBLIC_KEY found (Length: ${PUBLIC_KEY.length}, Starts with: ${PUBLIC_KEY.substring(0, 4)}...)`);

if (!SECRET_KEY) console.error('❌ RECURRENTE_SECRET_KEY is MISSING in .env');
else console.log(`✅ RECURRENTE_SECRET_KEY found (Length: ${SECRET_KEY.length}, Starts with: ${SECRET_KEY.substring(0, 4)}...)`);
console.log('--------------------------------------------------');

if (!PUBLIC_KEY || !SECRET_KEY) {
    console.error('⚠️ Cannot proceed without both keys.');
    process.exit(1);
}

const data = JSON.stringify({
    items: [{
        name: "Test Item",
        amount_in_cents: 1000,
        currency: "GTQ",
        quantity: 1
    }],
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel"
});

const options = {
    hostname: 'app.recurrente.com',
    port: 443,
    path: '/api/checkouts',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-PUBLIC-KEY': PUBLIC_KEY,
        'X-SECRET-KEY': SECRET_KEY,
        'Content-Length': data.length
    }
};

console.log('🚀 Sending Test Request to Recurrente API...');
const req = https.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);

    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('📥 Response Body:');
        console.log(responseBody);

        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ SUCCESS! Authentication works.');
        } else {
            console.log('\n❌ FAILED. Please check the error message above.');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Network Error:', error);
});

req.write(data);
req.end();
