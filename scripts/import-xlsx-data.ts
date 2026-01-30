/**
 * Script to import historical data from xlsx to Firebase
 * Run with: npx ts-node scripts/import-xlsx-data.ts
 * 
 * Before running:
 * 1. Make sure Firebase config in src/lib/firebase.ts has correct credentials
 * 2. Enable Realtime Database in Firebase Console
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import * as fs from 'fs';
import * as path from 'path';

// Firebase configuration - REPLACE WITH YOUR CREDENTIALS
const firebaseConfig = {
    apiKey: "AIzaSyDemo_ReplaceWithYourKey",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface MonthlyBill {
    room_id: number;
    month_key: string;
    occupants: number;
    electricity_old: number;
    electricity_new: number;
    electricity_rate: number;
    water_rate: number;
    is_paid: boolean;
    notes?: string;
}

// Parse xlsx_data.json and extract bills
async function parseXlsxData(): Promise<MonthlyBill[]> {
    const jsonPath = path.join(__dirname, '..', 'xlsx_data.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);

    const bills: MonthlyBill[] = [];

    // Electricity data starts at row 3 (index 2), columns:
    // B: date (index 1)
    // C: Room 1 electricity_new (index 2)
    // D: Room 2 electricity_new (index 3)
    // E: Room 3 electricity_new (index 4)
    // F: Room 4 electricity_new (index 5)

    // Extract electricity readings (rows 3-42 have actual data from 2022-09 to 2025-12)
    const electricityData: { month: string; rooms: number[] }[] = [];

    for (let i = 2; i <= 41; i++) {
        const row = data[i];
        if (!row || !row[1]) continue;

        const dateStr = row[1];
        // Convert date to YYYY-MM format
        let monthKey: string;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            // Already in YYYY-MM-DD format
            monthKey = dateStr.substring(0, 7);
        } else {
            continue;
        }

        const roomElectricity = [
            typeof row[2] === 'number' ? row[2] : 0,
            typeof row[3] === 'number' ? row[3] : 0,
            typeof row[4] === 'number' ? row[4] : 0,
            typeof row[5] === 'number' ? row[5] : 0,
        ];

        electricityData.push({ month: monthKey, rooms: roomElectricity });
    }

    // Occupants data starts around row 50 (index 49), find it by looking for header
    let occupantsStartRow = -1;
    for (let i = 45; i < 55; i++) {
        if (data[i] && data[i][1] && data[i][2] === 'Phòng 1') {
            occupantsStartRow = i + 1;
            break;
        }
    }

    // Build occupants map (month -> [room1, room2, room3, room4])
    const occupantsMap: Record<string, number[]> = {};

    if (occupantsStartRow > 0) {
        for (let i = occupantsStartRow; i < occupantsStartRow + 50; i++) {
            const row = data[i];
            if (!row || !row[1]) continue;

            const dateStr = row[1];
            let monthKey: string | null = null;

            if (typeof dateStr === 'string') {
                // Try different date formats
                if (dateStr.includes('-')) {
                    // YYYY-MM-DD format
                    monthKey = dateStr.substring(0, 7);
                } else if (dateStr.includes('/')) {
                    // DD/MM/YYYY format
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const year = parts[2].length === 4 ? parts[2] : '20' + parts[2];
                        monthKey = `${year}-${parts[1].padStart(2, '0')}`;
                    }
                }
            }

            if (!monthKey) continue;

            occupantsMap[monthKey] = [
                typeof row[2] === 'number' ? row[2] : 0,
                typeof row[3] === 'number' ? row[3] : 0,
                typeof row[4] === 'number' ? row[4] : 0,
                typeof row[5] === 'number' ? row[5] : 0,
            ];
        }
    }

    // Generate bills for each month/room combination
    for (let i = 1; i < electricityData.length; i++) {
        const current = electricityData[i];
        const previous = electricityData[i - 1];

        // Get correct month for this bill (previous month's data is the "old" reading)
        const monthKey = current.month;
        const occupants = occupantsMap[monthKey] || [1, 1, 1, 1];

        // Determine electricity rate based on date (prices changed over time)
        let electricityRate = 4000;  // Default old rate
        const [year, month] = monthKey.split('-').map(Number);
        if (year > 2024 || (year === 2024 && month >= 10)) {
            electricityRate = 5000;
        } else if (year === 2024 && month >= 5) {
            electricityRate = 4000;
        }

        for (let roomId = 1; roomId <= 4; roomId++) {
            const bill: MonthlyBill = {
                room_id: roomId,
                month_key: monthKey,
                occupants: occupants[roomId - 1],
                electricity_old: previous.rooms[roomId - 1],
                electricity_new: current.rooms[roomId - 1],
                electricity_rate: electricityRate,
                water_rate: 80000,
                is_paid: true,  // Historical data, assume paid
                notes: undefined
            };

            bills.push(bill);
        }
    }

    return bills;
}

async function importToFirebase(bills: MonthlyBill[]) {
    // Group bills by month
    const billsByMonth: Record<string, Record<string, MonthlyBill>> = {};

    for (const bill of bills) {
        if (!billsByMonth[bill.month_key]) {
            billsByMonth[bill.month_key] = {};
        }
        billsByMonth[bill.month_key][`room_${bill.room_id}`] = bill;
    }

    console.log(`Importing ${Object.keys(billsByMonth).length} months of data...`);

    // Import to Firebase
    for (const [month, monthData] of Object.entries(billsByMonth)) {
        const monthRef = ref(db, `monthly_bills/${month}`);
        await set(monthRef, monthData);
        console.log(`✓ Imported ${month}`);
    }

    console.log('\n✅ Import complete!');
}

async function main() {
    try {
        console.log('📊 Parsing xlsx data...');
        const bills = await parseXlsxData();
        console.log(`Found ${bills.length} bills to import\n`);

        console.log('🔥 Importing to Firebase...');
        await importToFirebase(bills);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
