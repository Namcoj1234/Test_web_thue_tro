"use client";

import { useState } from "react";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { RoomCard } from "@/components/RoomCard";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { AnalyticsView } from "@/components/AnalyticsView";
import { MonthlyBill } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BarChart3 } from "lucide-react";

export default function Home() {
  const { selectedMonth, setSelectedMonth, bills, loading, updateBill, calculateBill } = useMonthlyData();
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [activeTab, setActiveTab] = useState<'management' | 'analytics'>('management');

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Nhà Trọ</h1>
            <p className="text-slate-500 font-medium">Hệ thống tính tiền và thống kê tự động</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Tabs Trigger */}
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveTab('management')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'management'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Quản Lý
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'analytics'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                Thống Kê
              </button>
            </div>

            {activeTab === 'management' && (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tháng</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-8 border-none bg-transparent font-bold text-slate-900 focus-visible:ring-0 w-[140px]"
                />
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        {activeTab === 'management' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
                <span className="text-slate-500 font-medium">Đang đồng bộ dữ liệu...</span>
              </div>
            ) : bills.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 py-24 text-center">
                <p className="text-slate-400 font-medium italic">Không tìm thấy dữ liệu cho tháng này.</p>
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
          </div>
        ) : (
          <AnalyticsView />
        )}

        {/* Modals */}
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
