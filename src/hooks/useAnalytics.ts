import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MonthlyBill } from '@/types';
import { format, subMonths, startOfMonth } from 'date-fns';

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

export function useAnalytics() {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                // Get last 6 months keys
                const months = [];
                for (let i = 0; i < 6; i++) {
                    months.push(format(subMonths(new Date(), i), 'yyyy-MM'));
                }

                const { data: bills, error } = await supabase
                    .from('monthly_bills')
                    .select('*')
                    .in('month_key', months)
                    .order('month_key', { ascending: true });

                if (error) throw error;

                // Group by month
                const grouped = months.reverse().map(m => {
                    const monthBills = (bills || []).filter(b => b.month_key === m);

                    const roomData = [1, 2, 3, 4].map(roomId => {
                        const bill = monthBills.find(b => b.room_id === roomId);
                        const usage = bill ? Math.max(0, (bill.electricity_new ?? 0) - (bill.electricity_old ?? 0)) : 0;
                        const occupants = bill?.occupants ?? 0;
                        const revenue = (occupants * 1000000) + (occupants * 80000) + (usage * 5000);

                        return { room_id: roomId, usage, revenue };
                    });

                    const totalRevenue = roomData.reduce((sum, r) => sum + r.revenue, 0);

                    return {
                        month: m,
                        monthDisplay: `T${parseInt(m.split('-')[1])}`,
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
    }, []);

    return { data, loading };
}
