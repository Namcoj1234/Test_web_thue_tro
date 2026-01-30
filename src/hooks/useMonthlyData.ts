import { useState, useEffect, useCallback } from 'react';
import { db, ref, get, set, update, onValue, getBillsPath, getBillPath } from '@/lib/firebase';
import { MonthlyBill, BillCalculation, DEFAULT_ELECTRICITY_RATE, DEFAULT_WATER_RATE, DEFAULT_ROOM_RENT } from '@/types';

export function useMonthlyData() {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [bills, setBills] = useState<MonthlyBill[]>([]);
    const [loading, setLoading] = useState(false);

    // Helper calculation using dynamic rates
    const calculateBill = (bill: MonthlyBill): BillCalculation => {
        const electricityUsage = Math.max(0, (bill.electricity_new ?? 0) - (bill.electricity_old ?? 0));
        const electricityRate = bill.electricity_rate ?? DEFAULT_ELECTRICITY_RATE;
        const waterRate = bill.water_rate ?? DEFAULT_WATER_RATE;

        const electricityCost = electricityUsage * electricityRate;
        const waterCost = (bill.occupants ?? 0) * waterRate;
        const roomRent = (bill.occupants ?? 0) * DEFAULT_ROOM_RENT;

        const totalBill = roomRent + waterCost + electricityCost;

        let perPerson = 0;
        if ((bill.occupants ?? 0) > 0) {
            perPerson = (DEFAULT_ROOM_RENT + waterRate) + (electricityCost / bill.occupants!);
        }

        return {
            electricityUsage,
            electricityCost,
            waterCost,
            roomRent,
            totalBill,
            perPerson
        };
    };

    const fetchMonthData = useCallback(async (month: string) => {
        setLoading(true);
        try {
            const billsRef = ref(db, getBillsPath(month));
            const snapshot = await get(billsRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                const billsArray: MonthlyBill[] = Object.values(data);

                // Check if data is valid (must have at least 1 room with valid ID)
                // If existing data consists of "undefined" rooms, we should treat it as non-existent and regenerate.
                const isValid = billsArray.length > 0 && billsArray.every(b => b.room_id && b.room_id > 0);

                if (isValid) {
                    billsArray.sort((a, b) => (a.room_id || 0) - (b.room_id || 0));
                    setBills(billsArray);
                    setLoading(false);
                    return;
                }
                console.warn('Found invalid/incomplete data for month, regenerating...', month);
                // If invalid, fall through to regeneration logic below
            }

            // Auto-seed from previous month if no data exists
            const [year, m] = month.split('-').map(Number);
            const prevDate = new Date(year, m - 1 - 1, 1);
            const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

            const prevBillsRef = ref(db, getBillsPath(prevMonthStr));
            const prevSnapshot = await get(prevBillsRef);

            let newBillsData: Record<string, MonthlyBill> = {};

            if (prevSnapshot.exists()) {
                const prevData = prevSnapshot.val();
                Object.entries(prevData).forEach(([key, prev]: [string, any]) => {
                    // Robustly determine room_id
                    let roomId = prev.room_id;
                    if (!roomId && key.startsWith('room_')) {
                        roomId = parseInt(key.replace('room_', ''));
                    }
                    if (!roomId) return; // Skip if can't determine room_id

                    const newBill: MonthlyBill = {
                        room_id: roomId,
                        month_key: month,
                        occupants: prev.occupants ?? 0,
                        // Fix for old electricity index: MUST take NEW index from previous month
                        // If previous new is 0 (or missing), fallback to old, or 0.
                        electricity_old: prev.electricity_new && prev.electricity_new > 0
                            ? prev.electricity_new
                            : (prev.electricity_old || 0),
                        electricity_new: 0,
                        electricity_rate: prev.electricity_rate ?? DEFAULT_ELECTRICITY_RATE,
                        water_rate: prev.water_rate ?? DEFAULT_WATER_RATE,
                        is_paid: false,
                        notes: null
                    };
                    newBillsData[`room_${roomId}`] = newBill;
                });
            } else {
                // Create empty bills for all 4 rooms
                [1, 2, 3, 4].forEach(id => {
                    newBillsData[`room_${id}`] = {
                        room_id: id,
                        month_key: month,
                        occupants: 0,
                        electricity_old: 0,
                        electricity_new: 0,
                        electricity_rate: DEFAULT_ELECTRICITY_RATE,
                        water_rate: DEFAULT_WATER_RATE,
                        is_paid: false,
                        notes: null
                    };
                });
            }

            // If prevData existed but was empty/malformed, ensure we have at least 4 rooms
            [1, 2, 3, 4].forEach(id => {
                if (!newBillsData[`room_${id}`]) {
                    newBillsData[`room_${id}`] = {
                        room_id: id,
                        month_key: month,
                        occupants: 0,
                        electricity_old: 0,
                        electricity_new: 0,
                        electricity_rate: DEFAULT_ELECTRICITY_RATE,
                        water_rate: DEFAULT_WATER_RATE,
                        is_paid: false,
                        notes: null
                    };
                }
            });

            // Save new bills to Firebase
            await set(ref(db, getBillsPath(month)), newBillsData);

            // No need to setBills here because onValue listener will trigger consistently
            // But we can do optimistic update if we want.
            const billsArray: MonthlyBill[] = Object.values(newBillsData);
            billsArray.sort((a, b) => a.room_id - b.room_id);
            setBills(billsArray);

        } catch (err) {
            console.error('Error in fetchMonthData:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBill = async (roomId: number, updates: Partial<MonthlyBill>) => {
        // Optimistic update
        setBills(prev => prev.map(b => b.room_id === roomId ? { ...b, ...updates } : b));

        try {
            const billRef = ref(db, getBillPath(selectedMonth, roomId));
            await update(billRef, updates);
        } catch (error) {
            console.error('Update failed:', error);
            fetchMonthData(selectedMonth);
        }
    };

    const updateAllRates = async (electricity_rate: number, water_rate: number) => {
        // Optimistic update
        const updates = bills.map(b => ({ ...b, electricity_rate, water_rate }));
        setBills(updates);

        try {
            const billsRef = ref(db, getBillsPath(selectedMonth));
            const updateData: Record<string, any> = {};

            bills.forEach(bill => {
                updateData[`room_${bill.room_id}/electricity_rate`] = electricity_rate;
                updateData[`room_${bill.room_id}/water_rate`] = water_rate;
            });

            await update(billsRef, updateData);
        } catch (error) {
            console.error('Bulk update failed:', error);
            fetchMonthData(selectedMonth);
        }
    };

    // Set up real-time listener for live sync across devices
    useEffect(() => {
        setLoading(true);
        const billsRef = ref(db, getBillsPath(selectedMonth));

        // First fetch data
        fetchMonthData(selectedMonth);

        // Then set up real-time listener
        const unsubscribe = onValue(billsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const billsArray: MonthlyBill[] = Object.values(data);
                billsArray.sort((a, b) => a.room_id - b.room_id);
                setBills(billsArray);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedMonth, fetchMonthData]);

    return {
        selectedMonth,
        setSelectedMonth,
        bills,
        loading,
        updateBill: (id: number, updates: Partial<MonthlyBill>) => {
            // Find the room_id from bills array (id was previously database id, now we use room_id)
            const bill = bills.find(b => b.id === id || b.room_id === id);
            if (bill) {
                updateBill(bill.room_id, updates);
            }
        },
        updateAllRates,
        calculateBill
    };
}
