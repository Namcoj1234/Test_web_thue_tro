import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, onValue, push, child } from 'firebase/database';

// Firebase configuration - FREE TIER (no pause, no expiry)
const firebaseConfig = {
    apiKey: "AIzaSyDemo_ReplaceWithYourKey",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Helper functions for database operations
export { ref, get, set, update, onValue, push, child };

// Database paths
export const BILLS_PATH = 'monthly_bills';
export const getBillsPath = (monthKey: string) => `${BILLS_PATH}/${monthKey}`;
export const getBillPath = (monthKey: string, roomId: number) => `${BILLS_PATH}/${monthKey}/room_${roomId}`;
