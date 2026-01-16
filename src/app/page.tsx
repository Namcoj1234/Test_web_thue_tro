"use client";

import { useState } from "react";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { RoomCard } from "@/components/RoomCard";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { MonthlyBill } from "@/types";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { selectedMonth, setSelectedMonth, bills, loading, updateBill, calculateBill } = useMonthlyData();
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản Lý Nhà Trọ</h1>
            <p className="text-slate-500">Bảng điều khiển và tính tiền phòng theo tháng</p>
          </div>
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">Chọn tháng:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full md:w-48 bg-white"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <span className="ml-3 text-slate-500">Đang tải dữ liệu...</span>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Không có dữ liệu cho tháng này.
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
