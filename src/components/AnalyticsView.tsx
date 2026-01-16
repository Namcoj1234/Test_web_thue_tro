"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsViewProps {
    selectedMonth: string;
}

export function AnalyticsView({ selectedMonth }: AnalyticsViewProps) {
    const { data, loading } = useAnalytics(selectedMonth);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                <span className="ml-3 text-slate-500">Đang tải biểu đồ...</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-24 text-center">
                <p className="text-slate-400 font-medium italic">Không có dữ liệu để hiển thị biểu đồ.</p>
                <p className="text-slate-500 text-sm mt-2">Vui lòng nhập dữ liệu cho các tháng trước.</p>
            </div>
        );
    }

    // Transform data for Usage Chart
    const usageData = data.map(d => ({
        month: d.monthDisplay,
        'Phòng 1': d.rooms.find(r => r.room_id === 1)?.usage || 0,
        'Phòng 2': d.rooms.find(r => r.room_id === 2)?.usage || 0,
        'Phòng 3': d.rooms.find(r => r.room_id === 3)?.usage || 0,
        'Phòng 4': d.rooms.find(r => r.room_id === 4)?.usage || 0,
    }));

    const revenueData = data.map(d => ({
        month: d.monthDisplay,
        'Doanh thu': d.totalRevenue
    }));

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    📊 Đang hiển thị dữ liệu <strong>6 tháng</strong> xung quanh tháng <strong>{selectedMonth}</strong>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Electricity Usage Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Xu hướng tiêu thụ điện (kWh)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={usageData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="Phòng 1" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Phòng 2" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Phòng 3" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Phòng 4" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Tổng doanh thu theo tháng (VND)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}tr`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="Doanh thu" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
