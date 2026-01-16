import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MonthlyBill, BillCalculation, DEFAULT_ELECTRICITY_RATE, DEFAULT_WATER_RATE, DEFAULT_ROOM_RENT } from '@/types';

export function useMonthlyData() {
    const [selectedMonth, setSelectedMonth] = useState('2025-12');
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
            const { data: currentData, error: currentError } = await supabase
                .from('monthly_bills')
                .select('*')
                .eq('month_key', month)
                .order('room_id');

            if (currentError) throw currentError;

            if (currentData && currentData.length > 0) {
                setBills(currentData);
                setLoading(false);
                return;
            }

            // Auto-seed from previous month
            const [year, m] = month.split('-').map(Number);
            const prevDate = new Date(year, m - 1 - 1, 1);
            const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

            const { data: prevData, error: prevError } = await supabase
                .from('monthly_bills')
                .select('*')
                .eq('month_key', prevMonthStr)
                .order('room_id');

            if (prevError) throw prevError;

            let newBillsPayload: any[] = [];

            if (prevData && prevData.length > 0) {
                // Carry over rates from previous month
                newBillsPayload = prevData.map(prev => ({
                    room_id: prev.room_id,
                    month_key: month,
                    occupants: prev.occupants,
                    electricity_old: prev.electricity_new,
                    electricity_new: 0,
                    electricity_rate: prev.electricity_rate ?? DEFAULT_ELECTRICITY_RATE,
                    water_rate: prev.water_rate ?? DEFAULT_WATER_RATE,
                    is_paid: false,
                    notes: null
                }));
            } else {
                newBillsPayload = [1, 2, 3, 4].map(id => ({
                    room_id: id,
                    month_key: month,
                    occupants: 0,
                    electricity_old: 0,
                    electricity_new: 0,
                    electricity_rate: DEFAULT_ELECTRICITY_RATE,
                    water_rate: DEFAULT_WATER_RATE,
                    is_paid: false,
                    notes: null
                }));
            }

            const { data: insertedData, error: insertError } = await supabase
                .from('monthly_bills')
                .insert(newBillsPayload)
                .select()
                .order('room_id');

            if (insertError) throw insertError;

            setBills(insertedData || []);

        } catch (err) {
            console.error('Error in fetchMonthData:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateBill = async (id: number, updates: Partial<MonthlyBill>) => {
        setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

        const { error } = await supabase
            .from('monthly_bills')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Update failed:', error);
            fetchMonthData(selectedMonth);
        }
    };

    const updateAllRates = async (electricity_rate: number, water_rate: number) => {
        const updates = bills.map(b => ({ ...b, electricity_rate, water_rate }));
        setBills(updates);

        const { error } = await supabase
            .from('monthly_bills')
            .update({ electricity_rate, water_rate })
            .eq('month_key', selectedMonth);

        if (error) {
            console.error('Bulk update failed:', error);
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
        updateAllRates,
        calculateBill
    };
}
