import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, onValue, push, child } from 'firebase/database';

// Firebase configuration
// Hardcoded for easier deployment (Client-side keys are public anyway)
const firebaseConfig = {
    apiKey: "AIzaSyDRqMrZldZP_JyqOB0Gmyfcj8mPmpOUg6U",
    authDomain: "nhathue-380e3.firebaseapp.com",
    databaseURL: "https://nhathue-380e3-default-rtdb.firebaseio.com",
    projectId: "nhathue-380e3",
    storageBucket: "nhathue-380e3.firebasestorage.app",
    messagingSenderId: "944839237018",
    appId: "1:944839237018:web:7a70f4980286686d156e23"
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
