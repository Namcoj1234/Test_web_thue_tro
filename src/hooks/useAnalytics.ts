import { useState, useEffect } from 'react';
import { db, ref, get, getBillsPath } from '@/lib/firebase';
import { MonthlyBill, DEFAULT_ELECTRICITY_RATE, DEFAULT_WATER_RATE, DEFAULT_ROOM_RENT } from '@/types';
import { format, subMonths } from 'date-fns';

export interface AnalyticsData {
    month: string;
    monthDisplay: string;
    rooms: {
        room_id: number;
        usage: number;
        revenue: number;
    }[];
    totalRevenue: number;
}

export function useAnalytics(centerMonth?: string) {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                // Get 6 months centered around the selected month
                const baseDate = centerMonth ? new Date(centerMonth + '-01') : new Date();
                const months: string[] = [];

                // Get 3 months before and 2 months after the selected month
                for (let i = 3; i >= -2; i--) {
                    const monthDate = subMonths(baseDate, i);
                    months.push(format(monthDate, 'yyyy-MM'));
                }

                // Fetch data for all months from Firebase
                const allBills: MonthlyBill[] = [];

                await Promise.all(months.map(async (month) => {
                    const billsRef = ref(db, getBillsPath(month));
                    const snapshot = await get(billsRef);

                    if (snapshot.exists()) {
                        const monthData = snapshot.val();
                        Object.values(monthData).forEach((bill: any) => {
                            allBills.push(bill);
                        });
                    }
                }));

                // Group by month
                const grouped = months.map(m => {
                    const monthBills = allBills.filter(b => b.month_key === m);

                    const roomData = [1, 2, 3, 4].map(roomId => {
                        const bill = monthBills.find(b => b.room_id === roomId);
                        const usage = bill ? Math.max(0, (bill.electricity_new ?? 0) - (bill.electricity_old ?? 0)) : 0;
                        const occupants = bill?.occupants ?? 0;
                        const electricityRate = bill?.electricity_rate ?? DEFAULT_ELECTRICITY_RATE;
                        const waterRate = bill?.water_rate ?? DEFAULT_WATER_RATE;
                        const revenue = (occupants * DEFAULT_ROOM_RENT) + (occupants * waterRate) + (usage * electricityRate);

                        return { room_id: roomId, usage, revenue };
                    });

                    const totalRevenue = roomData.reduce((sum, r) => sum + r.revenue, 0);

                    return {
                        month: m,
                        monthDisplay: `T${parseInt(m.split('-')[1])}/${m.split('-')[0].slice(2)}`,
                        rooms: roomData,
                        totalRevenue
                    };
                });

                setData(grouped);
            } catch (err) {
                console.error('Analytics fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [centerMonth]);

    return { data, loading };
}
