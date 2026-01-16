import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthlyBill, ROOM_NAMES } from "@/types";
import { useMonthlyData } from "@/hooks/useMonthlyData";

interface RoomDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: MonthlyBill | null;
    onSave: (id: number, data: Partial<MonthlyBill>) => void;
}

export function RoomDetailModal({ isOpen, onClose, bill, onSave }: RoomDetailModalProps) {
    // Initialize with safe defaults
    const [formData, setFormData] = useState<Partial<MonthlyBill>>({
        occupants: 0,
        electricity_old: 0,
        electricity_new: 0
    });

    const { calculateBill } = useMonthlyData();

    useEffect(() => {
        if (bill) {
            setFormData({
                occupants: bill.occupants ?? 0,
                electricity_old: bill.electricity_old ?? 0,
                electricity_new: bill.electricity_new ?? 0,
            });
        }
    }, [bill]);

    if (!bill) return null;

    // Calculate preview based on current form data
    const previewBill = { ...bill, ...formData } as MonthlyBill;
    const calculated = calculateBill(previewBill);

    const handleSave = () => {
        if (bill.id) {
            onSave(bill.id, formData);
            onClose();
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const roomName = ROOM_NAMES[bill.room_id] || `Phòng ${bill.room_id}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết ${roomName} - Tháng ${bill.month_key}`}>
            <div className="grid gap-6 py-2">

                {/* Input Section */}
                <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="occupants" className="col-span-1">Số người ở</Label>
                        <div className="col-span-3 flex gap-2">
                            {[0, 1, 2].map(num => (
                                <Button
                                    key={num}
                                    type="button"
                                    variant={formData.occupants === num ? "default" : "outline"}
                                    onClick={() => setFormData(prev => ({ ...prev, occupants: num }))}
                                    className="flex-1"
                                >
                                    {num}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="elecOld">Số điện cũ</Label>
                            <Input
                                id="elecOld"
                                type="number"
                                disabled
                                value={formData.electricity_old ?? 0}
                                className="bg-slate-100/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="elecNew">Số điện mới</Label>
                            <Input
                                id="elecNew"
                                type="number"
                                value={formData.electricity_new ?? 0}
                                onChange={(e) => setFormData(prev => ({ ...prev, electricity_new: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Calculation Preview Section */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3 border">
                    <h4 className="font-semibold text-slate-900 border-b pb-2">Chi tính tiền</h4>

                    <div className="flex justify-between text-sm">
                        <span>Tiền phòng (1tr/người):</span>
                        <span className="font-medium">{formatMoney(calculated.roomRent)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Tiền nước (80k/người):</span>
                        <span className="font-medium">{formatMoney(calculated.waterCost)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Điện tiêu thụ:</span>
                        <span className="font-medium">{calculated.electricityUsage} kWh</span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span>Tiền điện (5k/kWh):</span>
                        <span className="font-medium">{formatMoney(calculated.electricityCost)}</span>
                    </div>

                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">Tổng cộng:</span>
                            <span className="font-bold text-xl text-slate-900">{formatMoney(calculated.totalBill)}</span>
                        </div>

                        {calculated.perPerson > 0 && (
                            <div className="flex justify-between items-center mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                                <span className="text-blue-800 font-semibold text-sm">Mỗi người đóng:</span>
                                <span className="text-blue-800 font-bold text-lg">{formatMoney(calculated.perPerson)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Button onClick={handleSave} className="w-full text-lg h-12">
                    Lưu thay đổi
                </Button>
            </div>
        </Modal>
    );
}
