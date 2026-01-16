"use client";

import { useState, useEffect } from "react";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RoomCard } from "@/components/RoomCard";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { MonthlyBill, DEFAULT_ELECTRICITY_RATE, DEFAULT_WATER_RATE } from "@/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertCircle, DollarSign, Zap, Users,
  Droplets, Settings, Save, Calendar
} from "lucide-react";

export default function Home() {
  const { selectedMonth, setSelectedMonth, bills, loading, updateBill, updateAllRates, calculateBill } = useMonthlyData();
  const { data: analyticsData } = useAnalytics(selectedMonth);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);

  // Settings state
  const [electricityRate, setElectricityRate] = useState(DEFAULT_ELECTRICITY_RATE);
  const [waterRate, setWaterRate] = useState(DEFAULT_WATER_RATE);

  // Update rates when bills change
  useEffect(() => {
    if (bills.length > 0) {
      setElectricityRate(bills[0].electricity_rate ?? DEFAULT_ELECTRICITY_RATE);
      setWaterRate(bills[0].water_rate ?? DEFAULT_WATER_RATE);
    }
  }, [bills]);

  const handleSaveRates = () => {
    updateAllRates(electricityRate, waterRate);
  };

  // Calculate stats
  const totalRevenue = bills.reduce((sum, b) => sum + calculateBill(b).totalBill, 0);
  const paidRevenue = bills.filter(b => b.is_paid).reduce((sum, b) => sum + calculateBill(b).totalBill, 0);
  const unpaidRevenue = totalRevenue - paidRevenue;
  const totalElectricity = bills.reduce((sum, b) => sum + calculateBill(b).electricityUsage, 0);
  const totalOccupants = bills.reduce((sum, b) => sum + (b.occupants ?? 0), 0);
  const occupancyRate = (totalOccupants / 8) * 100;

  // Analytics data
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

  const roomComparisonData = bills.map(b => {
    const calc = calculateBill(b);
    return {
      name: `P${b.room_id}`,
      revenue: calc.totalBill,
      electricity: calc.electricityUsage,
    };
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                Quản Lý Nhà Trọ
              </h1>
              <p className="text-slate-300 font-medium mt-1">Hệ thống quản lý thông minh & tự động</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                <span className="text-sm font-bold text-white/80">Tháng:</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 border-none bg-white font-bold text-slate-900 w-[150px] rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50"
                />
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-emerald-400/30">
                <p className="text-xs text-emerald-200 font-semibold uppercase tracking-wide">Tổng doanh thu</p>
                <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Settings Panel */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Cấu hình thu phí - Tháng {selectedMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  Đơn giá Điện (VNĐ/kWh)
                </label>
                <Input
                  type="number"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(Number(e.target.value))}
                  className="h-12 text-lg font-bold border-2 border-yellow-300 focus:border-yellow-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Đơn giá Nước (VNĐ/người)
                </label>
                <Input
                  type="number"
                  value={waterRate}
                  onChange={(e) => setWaterRate(Number(e.target.value))}
                  className="h-12 text-lg font-bold border-2 border-blue-300 focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleSaveRates}
                className="h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-base shadow-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Lưu cấu hình
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">
              💡 Thay đổi đơn giá sẽ áp dụng cho TẤT CẢ các phòng trong tháng này.
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Đã thu</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(paidRevenue)}</p>
                  <p className="text-xs text-slate-500 mt-1">{bills.filter(b => b.is_paid).length}/4 phòng</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Chưa thu</p>
                  <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(unpaidRevenue)}</p>
                  <p className="text-xs text-slate-500 mt-1">{bills.filter(b => !b.is_paid).length}/4 phòng</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Điện tiêu thụ</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{totalElectricity} kWh</p>
                  <p className="text-xs text-slate-500 mt-1">TB: {(totalElectricity / 4).toFixed(0)} kWh/phòng</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Tỉ lệ người ở</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{occupancyRate.toFixed(0)}%</p>
                  <p className="text-xs text-slate-500 mt-1">{totalOccupants}/8 người</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
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
                onUpdate={updateBill}
              />
            ))}
          </div>
        )}

        {/* Analytics */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Phân tích & Thống kê
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Xu hướng điện (6 tháng)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Phòng 1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Phòng 2" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Phòng 3" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Phòng 4" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Doanh thu theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000000}tr`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Doanh thu" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Phân bổ doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomComparisonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold">Điện theo phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roomComparisonData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(v: number) => `${v} kWh`} contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="electricity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
