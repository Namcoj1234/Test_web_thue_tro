"use client";

import { useState } from "react";
import { db, ref, set, getBillsPath } from "@/lib/firebase";
import { MonthlyBill } from "@/types";

// Pre-extracted data from xlsx
const ELECTRICITY_DATA: Record<string, number[]> = {
    "2022-09": [4729, 4617, 5421, 4327],
    "2022-10": [4742, 4630, 5424, 4329],
    "2022-11": [4765, 4638, 5432, 4334],
    "2022-12": [4777, 4653, 5435, 4343],
    "2023-01": [4787, 4658, 5447, 4346],
    "2023-02": [4806, 4675, 5478, 4353],
    "2023-03": [4819, 4689, 5486, 4358],
    "2023-04": [4839, 4701, 5503, 4382],
    "2023-05": [4863, 4709, 5517, 4400],
    "2023-06": [4884, 4721, 5533, 4423],
    "2023-07": [4903, 4735, 5549, 4461],
    "2023-08": [4915, 4749, 5559, 4502],
    "2023-09": [4942, 4763, 5578, 4502],
    "2023-10": [4952, 4771, 5593, 4530],
    "2023-11": [4969, 4787, 5599, 4537],
    "2023-12": [4978, 4799, 5601, 4563],
    "2024-01": [4990, 4812, 5603, 4591],
    "2024-02": [5000, 4826, 5615, 4622],
    "2024-03": [5024, 4839, 5624, 4683],
    "2024-04": [5068, 4855, 5642, 4693],
    "2024-05": [5109, 4874, 5654, 4705],
    "2024-06": [5171, 4889, 5670, 4727],
    "2024-07": [5182, 4906, 5680, 4745],
    "2024-08": [5194, 4923, 5693, 4761],
    "2024-09": [5205, 4937, 5712, 4786],
    "2024-10": [5220, 4954, 5721, 4811],
    "2024-11": [5235, 4964, 5729, 4841],
    "2024-12": [5240, 4970, 5733, 4853],
    "2025-01": [5246, 4976, 5736, 4879],
    "2025-02": [5250, 4992, 5738, 4899],
    "2025-03": [5256, 5009, 5766, 4923],
    "2025-04": [5264, 5015, 5778, 4934],
    "2025-05": [5271, 5032, 5797, 4961],
    "2025-06": [5277, 5055, 5821, 4982],
    "2025-07": [5284, 5079, 5852, 5009],
    "2025-08": [5291, 5098, 5870, 5027],
    "2025-09": [5294, 5124, 5877, 5040],
    "2025-10": [5296, 5154, 5889, 5040],
    "2025-11": [5298, 5180, 5902, 5041],
    "2025-12": [5298, 5200, 5906, 5049],
};

const OCCUPANTS_DATA: Record<string, number[]> = {
    "2022-10": [2, 1, 2, 1],
    "2022-11": [2, 1, 2, 1],
    "2022-12": [2, 1, 2, 1],
    "2023-01": [2, 1, 2, 1],
    "2023-02": [2, 1, 2, 1],
    "2023-03": [1, 1, 1, 1],
    "2023-04": [2, 1, 1, 2],
    "2023-05": [2, 1, 2, 1],
    "2023-06": [2, 1, 1, 2],
    "2023-07": [2, 1, 1, 2],
    "2023-08": [2, 1, 1, 2],
    "2023-09": [2, 1, 1, 0],
    "2023-10": [1, 1, 1, 2],
    "2023-11": [1, 1, 1, 1],
    "2023-12": [1, 1, 1, 1],
    "2024-01": [1, 1, 1, 1],
    "2024-02": [1, 1, 1, 1],
    "2024-03": [1, 1, 1, 1],
    "2024-04": [1, 1, 2, 1],
    "2024-05": [1, 1, 1, 2],
    "2024-06": [0.5, 1, 1, 1],
    "2024-07": [1, 1, 1, 1],
    "2024-08": [1, 1, 1, 1],
    "2024-09": [1, 1, 1, 1],
    "2024-10": [1, 1, 2, 1],
    "2024-11": [1, 1, 2, 1],
    "2024-12": [1, 1, 2, 1],
    "2025-01": [1, 1, 2, 1],
    "2025-02": [1, 1, 2, 1],
    "2025-03": [1, 1, 2, 1],
};

export default function ImportPage() {
    const [status, setStatus] = useState<string>("");
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const runImport = async () => {
        setImporting(true);
        setStatus("Bắt đầu import...");

        const months = Object.keys(ELECTRICITY_DATA).sort();
        const total = months.length - 1;
        let imported = 0;

        try {
            for (let i = 1; i < months.length; i++) {
                const currentMonth = months[i];
                const prevMonth = months[i - 1];

                const currentElec = ELECTRICITY_DATA[currentMonth];
                const prevElec = ELECTRICITY_DATA[prevMonth];
                const occupants = OCCUPANTS_DATA[currentMonth] || [1, 1, 1, 1];

                // Determine electricity rate based on date
                const [year, month] = currentMonth.split("-").map(Number);
                let electricityRate = 4000;
                if (year > 2024 || (year === 2024 && month >= 10)) {
                    electricityRate = 5000;
                }

                const monthData: Record<string, MonthlyBill> = {};

                for (let roomId = 1; roomId <= 4; roomId++) {
                    monthData[`room_${roomId}`] = {
                        room_id: roomId,
                        month_key: currentMonth,
                        occupants: occupants[roomId - 1],
                        electricity_old: prevElec[roomId - 1],
                        electricity_new: currentElec[roomId - 1],
                        electricity_rate: electricityRate,
                        water_rate: 80000,
                        is_paid: true,
                    };
                }

                await set(ref(db, getBillsPath(currentMonth)), monthData);
                imported++;
                setProgress(Math.round((imported / total) * 100));
                setStatus(`✓ Đã import ${currentMonth} (${imported}/${total})`);
            }

            setStatus(`✅ Hoàn thành! Đã import ${imported} tháng dữ liệu.`);
        } catch (error: any) {
            setStatus(`❌ Lỗi: ${error.message}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">
                    🔥 Import Dữ Liệu vào Firebase
                </h1>

                <div className="space-y-4 mb-6 text-slate-600">
                    <p>
                        Trang này sẽ import toàn bộ dữ liệu lịch sử từ file Excel vào Firebase.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="font-semibold text-amber-800">⚠️ Trước khi import:</p>
                        <ul className="list-disc list-inside mt-2 text-sm text-amber-700">
                            <li>Đảm bảo đã cấu hình Firebase trong <code>src/lib/firebase.ts</code></li>
                            <li>Bật Realtime Database trong Firebase Console</li>
                            <li>Chọn "Start in test mode" cho database rules</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-blue-800">📊 Dữ liệu sẽ import:</p>
                        <ul className="list-disc list-inside mt-2 text-sm text-blue-700">
                            <li>{Object.keys(ELECTRICITY_DATA).length - 1} tháng (10/2022 → 12/2025)</li>
                            <li>4 phòng × mỗi tháng</li>
                            <li>Số điện, số người ở, đơn giá</li>
                        </ul>
                    </div>
                </div>

                {progress > 0 && (
                    <div className="mb-4">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{progress}%</p>
                    </div>
                )}

                {status && (
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg mb-4 text-sm overflow-auto max-h-40">
                        {status}
                    </pre>
                )}

                <button
                    onClick={runImport}
                    disabled={importing}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all ${importing
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl"
                        }`}
                >
                    {importing ? "Đang import..." : "🚀 Bắt đầu Import"}
                </button>

                <p className="text-center text-sm text-slate-500 mt-4">
                    Sau khi import, quay lại <a href="/" className="text-blue-500 underline">trang chủ</a> để xem dữ liệu.
                </p>
            </div>
        </div>
    );
}
