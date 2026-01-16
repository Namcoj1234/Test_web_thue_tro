"use client";

import { useState } from "react";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RoomCard } from "@/components/RoomCard";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { MonthlyBill } from "@/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Zap, Users } from "lucide-react";

export default function Home() {
  const { selectedMonth, setSelectedMonth, bills, loading, updateBill, calculateBill } = useMonthlyData();
  const { data: analyticsData } = useAnalytics(selectedMonth);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);

  // Calculate current month stats
  const currentMonthStats = {
    totalRevenue: bills.reduce((sum, b) => {
      const calc = calculateBill(b);
      return sum + calc.totalBill;
    }, 0),
    totalElectricity: bills.reduce((sum, b) => {
      const calc = calculateBill(b);
      return sum + calc.electricityUsage;
    }, 0),
    totalOccupants: bills.reduce((sum, b) => sum + (b.occupants ?? 0), 0),
    occupancyRate: (bills.reduce((sum, b) => sum + (b.occupants ?? 0), 0) / 8) * 100, // 8 = max capacity
  };

  // Compare with previous month
  const prevMonthData = analyticsData.find(d => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return d.month === `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  });

  const revenueChange = prevMonthData
    ? ((currentMonthStats.totalRevenue - prevMonthData.totalRevenue) / prevMonthData.totalRevenue) * 100
    : 0;

  // Transform data for charts
  const usageData = analyticsData.map(d => ({
    month: d.monthDisplay,
    'Phòng 1': d.rooms.find(r => r.room_id === 1)?.usage || 0,
    'Phòng 2': d.rooms.find(r => r.room_id === 2)?.usage || 0,
    'Phòng 3': d.rooms.find(r => r.room_id === 3)?.usage || 0,
    'Phòng 4': d.rooms.find(r => r.room_id === 4)?.usage || 0,
  }));

  const revenueData = analyticsData.map(d => ({
    month: d.monthDisplay,
    'Doanh thu': d.totalRevenue
  }));

  // Room comparison data
  const roomComparisonData = bills.map(b => {
    const calc = calculateBill(b);
    return {
      name: `Phòng ${b.room_id}`,
      revenue: calc.totalBill,
      electricity: calc.electricityUsage,
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Nhà Trọ</h1>
              <p className="text-slate-500 font-medium mt-1">Hệ thống tính tiền và phân tích thông minh</p>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200">
              <span className="text-sm font-bold text-blue-700">Tháng:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 border-none bg-white font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-400 w-[150px] rounded-lg shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Doanh thu tháng</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(currentMonthStats.totalRevenue)}</p>
                  {revenueChange !== 0 && (
                    <p className={`text-xs mt-2 flex items-center gap-1 ${revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(revenueChange).toFixed(1)}% so với tháng trước
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Điện tiêu thụ</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{currentMonthStats.totalElectricity} kWh</p>
                  <p className="text-xs text-slate-500 mt-2">Trung bình {(currentMonthStats.totalElectricity / 4).toFixed(0)} kWh/phòng</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Số người ở</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{currentMonthStats.totalOccupants}/8</p>
                  <p className="text-xs text-slate-500 mt-2">Công suất {currentMonthStats.occupancyRate.toFixed(0)}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Phòng trống</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{bills.filter(b => (b.occupants ?? 0) === 0).length}/4</p>
                  {bills.filter(b => (b.occupants ?? 0) === 0).length > 0 && (
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Cần tìm khách
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
            <span className="text-slate-500 font-medium mt-4">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bills.map((bill) => (
              <RoomCard
                key={bill.id || bill.room_id}
                billData={bill}
                calculation={calculateBill(bill)}
                onEdit={setSelectedBill}
              />
            ))}
          </div>
        )}

        {/* Analytics Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Phân tích & Thống kê
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Electricity Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Xu hướng tiêu thụ điện (6 tháng)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="Phòng 1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Phòng 2" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Phòng 3" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Phòng 4" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Doanh thu theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000000}tr`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), 'Doanh thu']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="Doanh thu" fill="#0f172a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Room Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">So sánh doanh thu các phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomComparisonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {roomComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Electricity Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Tiêu thụ điện theo phòng (tháng này)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roomComparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} label={{ value: 'kWh', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v} kWh`, 'Tiêu thụ']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="electricity" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal */}
        <RoomDetailModal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          bill={selectedBill}
          onSave={updateBill}
        />
      </div>
    </div>
  );
}
