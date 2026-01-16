import { Users, Zap, Droplets, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBill, BillCalculation, ROOM_NAMES } from "@/types";
import { Button } from "@/components/ui/button";

interface RoomCardProps {
    billData: MonthlyBill;
    calculation: BillCalculation;
    onEdit: (bill: MonthlyBill) => void;
}

export function RoomCard({ billData, calculation, onEdit }: RoomCardProps) {
    // Use safe default for occupants
    const occupants = billData.occupants ?? 0;
    const isFull = occupants >= 2;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const roomName = ROOM_NAMES[billData.room_id] || `Phòng ${billData.room_id}`;

    return (
        <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-slate-900 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Home className="w-5 h-5 text-slate-500" />
                    {roomName}
                </CardTitle>
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {occupants}/2 người
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Zap className="w-4 h-4" /> Tiền điện</span>
                        <span className="font-medium">{formatMoney(calculation.electricityCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Droplets className="w-4 h-4" /> Tiền nước</span>
                        <span className="font-medium">{formatMoney(calculation.waterCost)}</span>
                    </div>

                    <div className="pt-4 border-t flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-500 font-medium">Tổng cộng</span>
                            <span className="text-lg font-bold text-slate-900">{formatMoney(calculation.totalBill)}</span>
                        </div>
                        {occupants > 0 && calculation.perPerson > 0 && (
                            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                <span>Mỗi người đóng:</span>
                                <span className="font-semibold text-blue-600">{formatMoney(calculation.perPerson)}</span>
                            </div>
                        )}
                    </div>

                    <Button onClick={() => onEdit(billData)} className="w-full mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        Chi tiết / Chỉnh sửa
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
