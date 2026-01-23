const https = require('https');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found at', envPath);
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return env;
}

const env = loadEnv();
const CHECKOUT_ID = process.argv[2]; // Get ID from command line arg

if (!CHECKOUT_ID) {
    console.error('❌ Please provide a Checkout ID as an argument.');
    console.error('Usage: node scripts/check-payment.js ch_...');
    process.exit(1);
}

const BASE_URL = 'https://app.recurrente.com/api';
const PUBLIC_KEY = env.RECURRENTE_PUBLIC_KEY;
const SECRET_KEY = env.RECURRENTE_SECRET_KEY;

// Initialize Prisma
const prisma = new PrismaClient();

async function checkPayment() {
    console.log(`🔍 Checking status for Checkout ID: ${CHECKOUT_ID}`);

    const options = {
        hostname: 'app.recurrente.com',
        path: `/api/checkouts/${CHECKOUT_ID}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-PUBLIC-KEY': PUBLIC_KEY,
            'X-SECRET-KEY': SECRET_KEY
        }
    };

    const checkout = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.end();
    });

    console.log('📄 Recurrente Status:', JSON.stringify(checkout, null, 2));

    const invoiceId = checkout.metadata?.invoiceId || checkout.checkout?.metadata?.invoiceId;
    const status = checkout.status || checkout.payment_status || checkout.checkout?.status;

    if (!invoiceId) {
        console.error('❌ No invoiceId found in checkout metadata.');
        return;
    }

    console.log(`🧾 Linked Invoice ID: ${invoiceId}`);
    console.log(`📊 Payment Status: ${status}`);

    if (status === 'paid' || status === 'completed' || status === 'succeeded') {
        console.log('✅ Payment successful! Updating database...');
        try {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: 'PAID',
                    updatedAt: new Date()
                }
            });
            console.log('🎉 Invoice successfully marked as PAID in database.');
        } catch (error) {
            console.error('❌ Error updating database:', error);
        }
    } else {
        console.log('⚠️ Payment is not yet paid/completed.');
    }
}

checkPayment()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
