
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));

const firebaseConfig = {
    apiKey: envConfig.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: envConfig.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: envConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: envConfig.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkData() {
    try {
        console.log('Checking Dec 2025 (Source)...');
        const decRef = ref(db, 'monthly_bills/2025-12');
        const decSnap = await get(decRef);
        if (decSnap.exists()) {
            console.log('✅ Dec 2025 Data:', JSON.stringify(decSnap.val(), null, 2));
        } else {
            console.log('❌ Dec 2025 Data NOT FOUND');
        }

        console.log('\nChecking Jan 2026 (Target)...');
        const janRef = ref(db, 'monthly_bills/2026-01');
        const janSnap = await get(janRef);
        if (janSnap.exists()) {
            console.log('✅ Jan 2026 Data:', JSON.stringify(janSnap.val(), null, 2));
        } else {
            console.log('❌ Jan 2026 Data NOT FOUND');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
