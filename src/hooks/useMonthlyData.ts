
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MonthlyBill, BillCalculation } from '@/types';

export function useMonthlyData() {
    const [selectedMonth, setSelectedMonth] = useState('2025-12');
    const [bills, setBills] = useState<MonthlyBill[]>([]);
    const [loading, setLoading] = useState(false);

    // Helper calculation
    const calculateBill = (bill: MonthlyBill): BillCalculation => {
        const electricityUsage = Math.max(0, (bill.electricity_new ?? 0) - (bill.electricity_old ?? 0));
        const electricityCost = electricityUsage * 5000;

        const waterCost = (bill.occupants ?? 0) * 80000;
        const roomRent = (bill.occupants ?? 0) * 1000000;

        const totalBill = roomRent + waterCost + electricityCost;

        let perPerson = 0;
        if ((bill.occupants ?? 0) > 0) {
            perPerson = (1000000 + 80000) + (electricityCost / bill.occupants!);
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
            console.log(`Fetching data for: ${month}`);

            // 1. Fetch current month using 'month_key'
            const { data: currentData, error: currentError } = await supabase
                .from('monthly_bills')
                .select('*')
                .eq('month_key', month)
                .order('room_id');

            if (currentError) {
                console.error('Error fetching current month:', JSON.stringify(currentError, null, 2));
                throw currentError;
            }

            // IF DATA EXISTS: Return immediately
            if (currentData && currentData.length > 0) {
                console.log('Data found for current month:', currentData);
                setBills(currentData);
                setLoading(false);
                return;
            }

            console.log(`No data for ${month}. Checking previous month...`);

            // 2. IF NO DATA: Fetch Previous Month
            const [year, m] = month.split('-').map(Number);
            const prevDate = new Date(year, m - 1 - 1, 1);
            const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

            const { data: prevData, error: prevError } = await supabase
                .from('monthly_bills')
                .select('*')
                .eq('month_key', prevMonthStr)
                .order('room_id');

            if (prevError) {
                console.error('Error fetching previous month:', JSON.stringify(prevError, null, 2));
                throw prevError;
            }

            let newBillsPayload: any[] = [];

            if (prevData && prevData.length > 0) {
                console.log(`Found previous month (${prevMonthStr}) data. Seeding...`);
                // Seed from previous month
                newBillsPayload = prevData.map(prev => ({
                    room_id: prev.room_id,
                    month_key: month,               // Correct column name
                    occupants: prev.occupants,       // Carry over
                    electricity_old: prev.electricity_new, // Prev New becomes Current Old
                    electricity_new: 0
                }));
            } else {
                console.log('No previous data found. Seeding default (Rooms 1-4)...');
                // Default seed
                newBillsPayload = [1, 2, 3, 4].map(id => ({
                    room_id: id,
                    month_key: month,               // Correct column name
                    occupants: 0,
                    electricity_old: 0,
                    electricity_new: 0
                }));
            }

            // 3. IMMEDIATE INSERT
            console.log('Inserting new payload:', newBillsPayload);

            const { data: insertedData, error: insertError } = await supabase
                .from('monthly_bills')
                .insert(newBillsPayload)
                .select()
                .order('room_id');

            if (insertError) {
                console.error('Error inserting seed data:', JSON.stringify(insertError, null, 2));
                throw insertError;
            }

            console.log('Successfully seeded data:', insertedData);
            setBills(insertedData || []);

        } catch (err) {
            console.error('CRITICAL ERROR in fetchMonthData:', err);
            if (typeof err === 'object' && err !== null) {
                console.error('Error details:', JSON.stringify(err, null, 2));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBill = async (id: number, updates: Partial<MonthlyBill>) => {
        // 1. Optimistic Update
        setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

        // 2. DB Update
        const { error } = await supabase
            .from('monthly_bills')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Update failed:', JSON.stringify(error, null, 2));
            fetchMonthData(selectedMonth);
        }
    };

    useEffect(() => {
        fetchMonthData(selectedMonth);
    }, [selectedMonth, fetchMonthData]);

    return {
        selectedMonth,
        setSelectedMonth,
        bills,
        loading,
        updateBill,
        calculateBill
    };
}
