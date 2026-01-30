import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, onValue, push, child } from 'firebase/database';

// Firebase configuration
// In production (Vercel), these will be loaded from Environment Variables
// For local development, you can create a .env.local file
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemo_ReplaceWithYourKey",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
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
