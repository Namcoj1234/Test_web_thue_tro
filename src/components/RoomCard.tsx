import { useState } from "react";
import { Home, Check, X, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBill, BillCalculation, ROOM_NAMES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoomCardProps {
    billData: MonthlyBill;
    calculation: BillCalculation;
    onEdit: (bill: MonthlyBill) => void;
    onUpdate: (id: number, updates: Partial<MonthlyBill>) => void;
}

export function RoomCard({ billData, calculation, onEdit, onUpdate }: RoomCardProps) {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState(billData.notes || '');

    const occupants = billData.occupants ?? 0;
    const isFull = occupants >= 2;
    const isPaid = billData.is_paid ?? false;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const roomName = ROOM_NAMES[billData.room_id] || `Phòng ${billData.room_id}`;

    const handleTogglePaid = () => {
        if (billData.id) {
            onUpdate(billData.id, { is_paid: !isPaid });
        }
    };

    const handleSaveNotes = () => {
        if (billData.id) {
            onUpdate(billData.id, { notes });
            setIsEditingNotes(false);
        }
    };

    return (
        <Card className={`hover:shadow-xl transition-all duration-300 border-t-4 ${isPaid ? 'border-t-emerald-500 bg-emerald-50/30' : 'border-t-orange-500 bg-white'
            }`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Home className="w-5 h-5 text-slate-600" />
                        {roomName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : occupants > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {occupants}/2
                        </div>
                        <button
                            onClick={handleTogglePaid}
                            className={`p-1.5 rounded-full transition-all ${isPaid
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                }`}
                            title={isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        >
                            {isPaid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Bill Details */}
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-600">Tiền phòng:</span>
                        <span className="font-medium">{formatMoney(calculation.roomRent)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Tiền nước:</span>
                        <span className="font-medium">{formatMoney(calculation.waterCost)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600">Tiền điện ({calculation.electricityUsage} kWh):</span>
                        <span className="font-medium">{formatMoney(calculation.electricityCost)}</span>
                    </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-dashed">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700 uppercase text-xs tracking-wide">Tổng cộng</span>
                        <span className="text-2xl font-extrabold text-emerald-600">{formatMoney(calculation.totalBill)}</span>
                    </div>
                    {occupants > 0 && calculation.perPerson > 0 && (
                        <div className="text-xs text-slate-500 text-right">
                            Mỗi người: <span className="font-semibold text-blue-600">{formatMoney(calculation.perPerson)}</span>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="pt-3 border-t">
                    {isEditingNotes ? (
                        <div className="space-y-2">
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú (VD: Thiếu 50k)"
                                className="text-sm"
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleSaveNotes} size="sm" className="flex-1 h-8 text-xs">Lưu</Button>
                                <Button onClick={() => setIsEditingNotes(false)} size="sm" variant="outline" className="flex-1 h-8 text-xs">Hủy</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-h-[20px]">
                                {notes ? (
                                    <p className="text-xs text-slate-600 italic">📝 {notes}</p>
                                ) : (
                                    <p className="text-xs text-slate-400">Chưa có ghi chú</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="p-1 hover:bg-slate-100 rounded"
                            >
                                <Edit3 className="w-3 h-3 text-slate-400" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Edit Button */}
                <Button
                    onClick={() => onEdit(billData)}
                    className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white h-9 text-sm font-semibold"
                >
                    Chỉnh sửa chi tiết
                </Button>
            </CardContent>
        </Card>
    );
}
